-- Create property_statistics_detailed table for comprehensive analytics
CREATE TABLE IF NOT EXISTS public.property_statistics_detailed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id)
);

-- Create property_comment_replies table for owner responses
CREATE TABLE IF NOT EXISTS public.property_comment_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES public.property_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create direct_messages table for private chat
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_threads table to group conversations
CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, buyer_id, seller_id)
);

-- Enable RLS on new tables
ALTER TABLE public.property_statistics_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

-- Policies for property_statistics_detailed
CREATE POLICY "Property owners can view their property statistics" ON public.property_statistics_detailed
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_statistics_detailed.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert property statistics" ON public.property_statistics_detailed
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Property owners can update their property statistics" ON public.property_statistics_detailed
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_statistics_detailed.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- Policies for property_comment_replies
CREATE POLICY "Anyone can view comment replies" ON public.property_comment_replies
  FOR SELECT USING (true);

CREATE POLICY "Property owners can insert replies to their property comments" ON public.property_comment_replies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.property_comments pc
      JOIN public.properties p ON p.id = pc.property_id
      WHERE pc.id = property_comment_replies.comment_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Reply authors can update their replies" ON public.property_comment_replies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Reply authors can delete their replies" ON public.property_comment_replies
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for direct_messages
CREATE POLICY "Users can view messages they sent or received" ON public.direct_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can insert messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Message sender can update their messages" ON public.direct_messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Message sender can delete their messages" ON public.direct_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Policies for message_threads
CREATE POLICY "Users can view threads they participate in" ON public.message_threads
  FOR SELECT USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

CREATE POLICY "Users can insert threads" ON public.message_threads
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

CREATE POLICY "Thread participants can update threads" ON public.message_threads
  FOR UPDATE USING (
    auth.uid() = buyer_id OR auth.uid() = seller_id
  );

-- Create function to update detailed statistics
CREATE OR REPLACE FUNCTION public.update_property_statistics_detailed()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.property_statistics_detailed (
    property_id,
    total_views,
    unique_visitors,
    favorites_count,
    inquiries_count,
    comments_count,
    last_viewed_at,
    updated_at
  )
  VALUES (
    NEW.property_id,
    (SELECT COUNT(*) FROM public.property_views WHERE property_id = NEW.property_id),
    (SELECT COUNT(DISTINCT user_id) FROM public.property_views WHERE property_id = NEW.property_id),
    (SELECT COUNT(*) FROM public.property_favorites WHERE property_id = NEW.property_id),
    (SELECT COUNT(*) FROM public.property_inquiries WHERE property_id = NEW.property_id),
    (SELECT COUNT(*) FROM public.property_comments WHERE property_id = NEW.property_id),
    NEW.viewed_at,
    NOW()
  )
  ON CONFLICT (property_id) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_visitors = EXCLUDED.unique_visitors,
    favorites_count = EXCLUDED.favorites_count,
    inquiries_count = EXCLUDED.inquiries_count,
    comments_count = EXCLUDED.comments_count,
    last_viewed_at = EXCLUDED.last_viewed_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for property_views to update detailed statistics
DROP TRIGGER IF EXISTS trigger_update_property_statistics_detailed ON public.property_views;
CREATE TRIGGER trigger_update_property_statistics_detailed
  AFTER INSERT OR UPDATE ON public.property_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_statistics_detailed();

-- Create function to update comment count when comments are added/removed
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.property_statistics_detailed 
    SET comments_count = comments_count + 1, updated_at = NOW()
    WHERE property_id = NEW.property_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.property_statistics_detailed 
    SET comments_count = comments_count - 1, updated_at = NOW()
    WHERE property_id = OLD.property_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for property_comments to update comment count
DROP TRIGGER IF EXISTS trigger_update_comment_count ON public.property_comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON public.property_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_count();

-- Create function to update favorite count
CREATE OR REPLACE FUNCTION public.update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.property_statistics_detailed 
    SET favorites_count = favorites_count + 1, updated_at = NOW()
    WHERE property_id = NEW.property_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.property_statistics_detailed 
    SET favorites_count = favorites_count - 1, updated_at = NOW()
    WHERE property_id = OLD.property_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for property_favorites to update favorite count
DROP TRIGGER IF EXISTS trigger_update_favorite_count ON public.property_favorites;
CREATE TRIGGER trigger_update_favorite_count
  AFTER INSERT OR DELETE ON public.property_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_favorite_count();

-- Create function to update inquiry count
CREATE OR REPLACE FUNCTION public.update_inquiry_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.property_statistics_detailed 
    SET inquiries_count = inquiries_count + 1, updated_at = NOW()
    WHERE property_id = NEW.property_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.property_statistics_detailed 
    SET inquiries_count = inquiries_count - 1, updated_at = NOW()
    WHERE property_id = OLD.property_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for property_inquiries to update inquiry count
DROP TRIGGER IF EXISTS trigger_update_inquiry_count ON public.property_inquiries;
CREATE TRIGGER trigger_update_inquiry_count
  AFTER INSERT OR DELETE ON public.property_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inquiry_count();

-- Create function to handle message thread updates
CREATE OR REPLACE FUNCTION public.update_message_thread()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or create thread
  INSERT INTO public.message_threads (
    property_id,
    buyer_id,
    seller_id,
    last_message_at,
    updated_at
  )
  VALUES (
    NEW.property_id,
    CASE WHEN NEW.sender_id = (SELECT user_id FROM public.properties WHERE id = NEW.property_id) 
         THEN NEW.receiver_id ELSE NEW.sender_id END,
    (SELECT user_id FROM public.properties WHERE id = NEW.property_id),
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (property_id, buyer_id, seller_id) DO UPDATE SET
    last_message_at = EXCLUDED.last_message_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for direct_messages to update threads
DROP TRIGGER IF EXISTS trigger_update_message_thread ON public.direct_messages;
CREATE TRIGGER trigger_update_message_thread
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_message_thread();

-- Create function to handle reply updated_at
CREATE OR REPLACE FUNCTION public.handle_reply_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply updated_at
DROP TRIGGER IF EXISTS trigger_reply_updated_at ON public.property_comment_replies;
CREATE TRIGGER trigger_reply_updated_at
  BEFORE UPDATE ON public.property_comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_reply_updated_at();

-- Create function to handle message updated_at
CREATE OR REPLACE FUNCTION public.handle_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message updated_at
DROP TRIGGER IF EXISTS trigger_message_updated_at ON public.direct_messages;
CREATE TRIGGER trigger_message_updated_at
  BEFORE UPDATE ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_updated_at();

-- Create function to handle thread updated_at
CREATE OR REPLACE FUNCTION public.handle_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for thread updated_at
DROP TRIGGER IF EXISTS trigger_thread_updated_at ON public.message_threads;
CREATE TRIGGER trigger_thread_updated_at
  BEFORE UPDATE ON public.message_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_thread_updated_at();
