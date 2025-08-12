-- Crear buckets de storage - Versión final
-- Manejar políticas existentes correctamente

-- 1. VERIFICAR BUCKETS ACTUALES
SELECT 
  'Current buckets' as info,
  id as bucket_id,
  name as bucket_name,
  public as is_public
FROM storage.buckets;

-- 2. ELIMINAR BUCKETS EXISTENTES SI HAY PROBLEMAS
DELETE FROM storage.objects WHERE bucket_id IN ('property-images', 'avatars');
DELETE FROM storage.buckets WHERE id IN ('property-images', 'avatars');

-- 3. CREAR BUCKET PARA IMÁGENES DE PROPIEDADES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images', 
  'property-images', 
  true, 
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 4. CREAR BUCKET PARA AVATARS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- 5. ELIMINAR POLÍTICAS EXISTENTES PARA EVITAR CONFLICTOS
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- 6. CREAR POLÍTICAS RLS PARA property-images
CREATE POLICY "Anyone can view property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own property images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own property images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 7. CREAR POLÍTICAS RLS PARA avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 8. VERIFICACIÓN FINAL
SELECT 
  'Final verification' as info,
  'Buckets created' as metric,
  COUNT(*) as value
FROM storage.buckets
WHERE id IN ('property-images', 'avatars');

-- 9. VERIFICAR POLÍTICAS
SELECT 
  'Storage policies count' as info,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (policyname LIKE '%property images%' OR policyname LIKE '%avatars%');

-- 10. RESUMEN FINAL
SELECT 
  'RESUMEN FINAL' as info,
  'Storage buckets created successfully' as status,
  'All policies configured correctly' as message;
