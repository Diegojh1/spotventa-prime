-- Arreglar todos los sistemas: propiedades, imágenes y estadísticas
-- Después de las migraciones anteriores

-- 1. VERIFICAR Y ARREGLAR POLÍTICAS DE PROPERTIES
-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Users can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

-- Crear políticas correctas para properties
CREATE POLICY "Anyone can view active properties" ON public.properties
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all properties" ON public.properties
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Agents can insert properties" ON public.properties
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'agent'
    )
  );

CREATE POLICY "Agents can update their own properties" ON public.properties
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'agent'
    )
  );

CREATE POLICY "Agents can delete their own properties" ON public.properties
  FOR DELETE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'agent'
    )
  );

-- 2. VERIFICAR Y ARREGLAR STORAGE BUCKETS
-- Crear bucket de property-images si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-images', 'property-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Crear bucket de avatars si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 3. ARREGLAR POLÍTICAS DE STORAGE
-- Eliminar políticas existentes de storage
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Políticas para property-images
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

-- Políticas para avatars
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

-- 4. ARREGLAR SISTEMA DE ESTADÍSTICAS
-- Verificar que la tabla property_statistics existe y tiene la estructura correcta
CREATE TABLE IF NOT EXISTS public.property_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE UNIQUE,
  total_views INTEGER DEFAULT 0,
  total_favorites INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para property_statistics
ALTER TABLE public.property_statistics ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas problemáticas de property_statistics
DROP POLICY IF EXISTS "Anyone can view property statistics" ON public.property_statistics;
DROP POLICY IF EXISTS "System can insert property statistics" ON public.property_statistics;
DROP POLICY IF EXISTS "System can update property statistics" ON public.property_statistics;
DROP POLICY IF EXISTS "Agents can delete their property statistics" ON public.property_statistics;

-- Crear políticas permisivas para property_statistics
CREATE POLICY "Anyone can view property statistics" ON public.property_statistics
  FOR SELECT USING (true);

CREATE POLICY "System can insert property statistics" ON public.property_statistics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update property statistics" ON public.property_statistics
  FOR UPDATE USING (true);

CREATE POLICY "Agents can delete their property statistics" ON public.property_statistics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_statistics.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- 5. RECREAR FUNCIÓN DE TRIGGERS
CREATE OR REPLACE FUNCTION public.update_property_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar estadísticas cuando se inserta una vista
  IF TG_TABLE_NAME = 'property_views' THEN
    INSERT INTO public.property_statistics (property_id, total_views, last_viewed_at)
    VALUES (NEW.property_id, 1, NOW())
    ON CONFLICT (property_id) 
    DO UPDATE SET 
      total_views = property_statistics.total_views + 1,
      last_viewed_at = NOW(),
      updated_at = NOW();
  END IF;

  -- Actualizar estadísticas cuando se inserta un favorito
  IF TG_TABLE_NAME = 'property_favorites' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.property_statistics (property_id, total_favorites)
    VALUES (NEW.property_id, 1)
    ON CONFLICT (property_id) 
    DO UPDATE SET 
      total_favorites = property_statistics.total_favorites + 1,
      updated_at = NOW();
  END IF;

  -- Actualizar estadísticas cuando se elimina un favorito
  IF TG_TABLE_NAME = 'property_favorites' AND TG_OP = 'DELETE' THEN
    UPDATE public.property_statistics 
    SET total_favorites = total_favorites - 1,
        updated_at = NOW()
    WHERE property_id = OLD.property_id;
  END IF;

  -- Actualizar estadísticas cuando se inserta un comentario
  IF TG_TABLE_NAME = 'property_comments' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.property_statistics (property_id, total_comments)
    VALUES (NEW.property_id, 1)
    ON CONFLICT (property_id) 
    DO UPDATE SET 
      total_comments = property_statistics.total_comments + 1,
      updated_at = NOW();
  END IF;

  -- Actualizar estadísticas cuando se elimina un comentario
  IF TG_TABLE_NAME = 'property_comments' AND TG_OP = 'DELETE' THEN
    UPDATE public.property_statistics 
    SET total_comments = total_comments - 1,
        updated_at = NOW()
    WHERE property_id = OLD.property_id;
  END IF;

  -- Actualizar estadísticas cuando se inserta una consulta
  IF TG_TABLE_NAME = 'property_inquiries' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.property_statistics (property_id, total_inquiries)
    VALUES (NEW.property_id, 1)
    ON CONFLICT (property_id) 
    DO UPDATE SET 
      total_inquiries = property_statistics.total_inquiries + 1,
      updated_at = NOW();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. RECREAR TRIGGERS
DROP TRIGGER IF EXISTS trigger_update_property_statistics_views ON public.property_views;
DROP TRIGGER IF EXISTS trigger_update_property_statistics_favorites ON public.property_favorites;
DROP TRIGGER IF EXISTS trigger_update_property_statistics_comments ON public.property_comments;
DROP TRIGGER IF EXISTS trigger_update_property_statistics_inquiries ON public.property_inquiries;

CREATE TRIGGER trigger_update_property_statistics_views
  AFTER INSERT ON public.property_views
  FOR EACH ROW EXECUTE FUNCTION public.update_property_statistics();

CREATE TRIGGER trigger_update_property_statistics_favorites
  AFTER INSERT OR DELETE ON public.property_favorites
  FOR EACH ROW EXECUTE FUNCTION public.update_property_statistics();

CREATE TRIGGER trigger_update_property_statistics_comments
  AFTER INSERT OR DELETE ON public.property_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_property_statistics();

CREATE TRIGGER trigger_update_property_statistics_inquiries
  AFTER INSERT ON public.property_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_property_statistics();

-- 7. INICIALIZAR ESTADÍSTICAS PARA TODAS LAS PROPIEDADES
INSERT INTO public.property_statistics (property_id, total_views, total_favorites, total_comments, total_inquiries)
SELECT 
  p.id,
  COALESCE(pv.views_count, 0),
  COALESCE(pf.favorites_count, 0),
  COALESCE(pc.comments_count, 0),
  COALESCE(pi.inquiries_count, 0)
FROM public.properties p
LEFT JOIN (
  SELECT property_id, COUNT(*) as views_count 
  FROM public.property_views 
  GROUP BY property_id
) pv ON p.id = pv.property_id
LEFT JOIN (
  SELECT property_id, COUNT(*) as favorites_count 
  FROM public.property_favorites 
  GROUP BY property_id
) pf ON p.id = pf.property_id
LEFT JOIN (
  SELECT property_id, COUNT(*) as comments_count 
  FROM public.property_comments 
  GROUP BY property_id
) pc ON p.id = pc.property_id
LEFT JOIN (
  SELECT property_id, COUNT(*) as inquiries_count 
  FROM public.property_inquiries 
  GROUP BY property_id
) pi ON p.id = pi.property_id
WHERE NOT EXISTS (SELECT 1 FROM public.property_statistics WHERE property_id = p.id)
ON CONFLICT (property_id) DO NOTHING;

-- 8. VERIFICAR QUE TODO ESTÉ FUNCIONANDO
-- Mostrar resumen de políticas
SELECT 'properties policies' as table_name, COUNT(*) as policy_count
FROM pg_policies WHERE tablename = 'properties'
UNION ALL
SELECT 'property_statistics policies' as table_name, COUNT(*) as policy_count
FROM pg_policies WHERE tablename = 'property_statistics'
UNION ALL
SELECT 'storage objects policies' as table_name, COUNT(*) as policy_count
FROM pg_policies WHERE tablename = 'objects';

-- Mostrar estadísticas creadas
SELECT 
  'property_statistics count' as info,
  COUNT(*) as total_statistics
FROM public.property_statistics;

-- Mostrar buckets de storage
SELECT 
  'storage buckets' as info,
  id as bucket_id,
  name as bucket_name,
  public as is_public
FROM storage.buckets
WHERE id IN ('property-images', 'avatars');
