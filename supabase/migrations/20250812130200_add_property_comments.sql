-- Create property comments table
CREATE TABLE IF NOT EXISTS public.property_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on property_comments
ALTER TABLE public.property_comments ENABLE ROW LEVEL SECURITY;

-- Policies for property_comments
CREATE POLICY "Users can view all comments" ON public.property_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.property_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.property_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.property_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update comment updated_at
CREATE OR REPLACE FUNCTION public.handle_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment updated_at
DROP TRIGGER IF EXISTS handle_comment_updated_at ON public.property_comments;
CREATE TRIGGER handle_comment_updated_at
  BEFORE UPDATE ON public.property_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_updated_at();
