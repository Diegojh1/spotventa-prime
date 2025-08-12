-- Fix comments policies and ensure they work correctly

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view all comments" ON public.property_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.property_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.property_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.property_comments;

-- Recreate policies with better logic
CREATE POLICY "Users can view all comments" ON public.property_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.property_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.property_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.property_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure the foreign key constraint exists and is correct
DO $$
BEGIN
  -- Drop the constraint if it exists with wrong name
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'property_comments_user_id_fkey' 
    AND table_name = 'property_comments'
  ) THEN
    ALTER TABLE public.property_comments 
    DROP CONSTRAINT property_comments_user_id_fkey;
  END IF;
  
  -- Add the constraint with correct name
  ALTER TABLE public.property_comments 
  ADD CONSTRAINT property_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  
  -- Also ensure property_id foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'property_comments_property_id_fkey' 
    AND table_name = 'property_comments'
  ) THEN
    ALTER TABLE public.property_comments 
    ADD CONSTRAINT property_comments_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Insert some test data if the table is empty
INSERT INTO public.property_comments (property_id, user_id, message)
SELECT 
  p.id as property_id,
  u.id as user_id,
  'Comentario de prueba para verificar que funciona'
FROM public.properties p
CROSS JOIN auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.property_comments 
  WHERE property_id = p.id
)
LIMIT 1;
