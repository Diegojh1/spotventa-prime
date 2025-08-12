-- Add user_id to properties table if not exists
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create property views table to track buyer clicks
CREATE TABLE IF NOT EXISTS public.property_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, user_id)
);

-- Create property favorites table
CREATE TABLE IF NOT EXISTS public.property_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, user_id)
);

-- Create property inquiries table for buyer questions
CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

-- Policies for property_views
CREATE POLICY "Users can view their own property views" ON public.property_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own property views" ON public.property_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Property owners can view views on their properties" ON public.property_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_views.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- Policies for property_favorites
CREATE POLICY "Users can view their own favorites" ON public.property_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON public.property_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON public.property_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for property_inquiries
CREATE POLICY "Users can view their own inquiries" ON public.property_inquiries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inquiries" ON public.property_inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Property owners can view inquiries on their properties" ON public.property_inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_inquiries.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can update inquiries on their properties" ON public.property_inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_inquiries.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- Create function to update inquiry updated_at
CREATE OR REPLACE FUNCTION public.handle_inquiry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inquiry updated_at
DROP TRIGGER IF EXISTS handle_inquiry_updated_at ON public.property_inquiries;
CREATE TRIGGER handle_inquiry_updated_at
  BEFORE UPDATE ON public.property_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_inquiry_updated_at();
