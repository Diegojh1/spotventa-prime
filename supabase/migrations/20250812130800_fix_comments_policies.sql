-- Arreglar políticas RLS para property_comments
-- Después del cambio de ownership de propiedades

-- 1. Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Users can view all comments" ON public.property_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.property_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.property_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.property_comments;

-- 2. Crear políticas más permisivas para comentarios
-- Permitir que todos los usuarios vean todos los comentarios
CREATE POLICY "Anyone can view all comments" ON public.property_comments
  FOR SELECT USING (true);

-- Permitir que usuarios autenticados inserten comentarios
CREATE POLICY "Authenticated users can insert comments" ON public.property_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Permitir que usuarios actualicen sus propios comentarios
CREATE POLICY "Users can update their own comments" ON public.property_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir que usuarios eliminen sus propios comentarios
CREATE POLICY "Users can delete their own comments" ON public.property_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Verificar que las foreign keys estén correctas
DO $$ 
BEGIN
  -- Asegurar que la foreign key property_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'property_comments_property_id_fkey' 
    AND table_name = 'property_comments'
  ) THEN
    ALTER TABLE public.property_comments 
    ADD CONSTRAINT property_comments_property_id_fkey 
    FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;
  END IF;

  -- Asegurar que la foreign key user_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'property_comments_user_id_fkey' 
    AND table_name = 'property_comments'
  ) THEN
    ALTER TABLE public.property_comments 
    ADD CONSTRAINT property_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Verificar que RLS esté habilitado
ALTER TABLE public.property_comments ENABLE ROW LEVEL SECURITY;

-- 5. Insertar un comentario de prueba si no hay ninguno
INSERT INTO public.property_comments (property_id, user_id, message)
SELECT 
  p.id as property_id, 
  u.id as user_id, 
  'Comentario de prueba para verificar que el sistema funciona correctamente'
FROM public.properties p 
CROSS JOIN auth.users u 
WHERE NOT EXISTS (SELECT 1 FROM public.property_comments WHERE property_id = p.id) 
LIMIT 1;

-- 6. Mostrar información de debug
SELECT 
  'property_comments policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'property_comments';
