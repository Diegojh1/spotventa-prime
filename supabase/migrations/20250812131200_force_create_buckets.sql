-- Forzar creación de buckets de storage
-- El problema es que los buckets no se están creando correctamente

-- 1. VERIFICAR BUCKETS ACTUALES
SELECT 
  'Current buckets check' as info,
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets;

-- 2. ELIMINAR BUCKETS EXISTENTES SI HAY PROBLEMAS
-- Primero eliminar objetos si existen
DELETE FROM storage.objects WHERE bucket_id IN ('property-images', 'avatars');

-- Luego eliminar buckets
DELETE FROM storage.buckets WHERE id IN ('property-images', 'avatars');

-- 3. CREAR BUCKETS NUEVOS DE FORMA MÁS DIRECTA
-- Bucket para imágenes de propiedades
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images', 
  'property-images', 
  true, 
  52428800, 
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Bucket para avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, 
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 4. VERIFICAR QUE SE CREARON
SELECT 
  'Buckets created successfully' as info,
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id IN ('property-images', 'avatars');

-- 5. VERIFICAR POLÍTICAS EXISTENTES
SELECT 
  'Storage policies check' as info,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%upload%';

-- 6. CREAR POLÍTICAS SI NO EXISTEN
-- Políticas para property-images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view property images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Anyone can view property images" ON storage.objects
      FOR SELECT USING (bucket_id = 'property-images');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload property images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Authenticated users can upload property images" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'property-images' AND 
        auth.uid() IS NOT NULL
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own property images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Users can update their own property images" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'property-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own property images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Users can delete their own property images" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'property-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Políticas para avatars
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view avatars' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Anyone can view avatars" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload avatars' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid() IS NOT NULL
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatars' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Users can update their own avatars" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own avatars' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Users can delete their own avatars" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- 7. VERIFICACIÓN FINAL
SELECT 
  'Final verification' as info,
  'Buckets count' as metric,
  COUNT(*) as value
FROM storage.buckets
WHERE id IN ('property-images', 'avatars')

UNION ALL

SELECT 
  'Final verification' as info,
  'Policies count' as metric,
  COUNT(*)::text as value
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%upload%';
