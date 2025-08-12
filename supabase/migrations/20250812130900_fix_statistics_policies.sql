-- Arreglar políticas RLS para property_statistics
-- El problema está en que los triggers no pueden insertar en property_statistics

-- 1. Eliminar políticas existentes problemáticas
DROP POLICY IF EXISTS "Agents can view their property statistics" ON public.property_statistics;
DROP POLICY IF EXISTS "Agents can update their property statistics" ON public.property_statistics;

-- 2. Crear políticas más permisivas para property_statistics
-- Permitir que todos los usuarios vean estadísticas (necesario para triggers)
CREATE POLICY "Anyone can view property statistics" ON public.property_statistics
  FOR SELECT USING (true);

-- Permitir que el sistema inserte estadísticas (necesario para triggers)
CREATE POLICY "System can insert property statistics" ON public.property_statistics
  FOR INSERT WITH CHECK (true);

-- Permitir que el sistema actualice estadísticas (necesario para triggers)
CREATE POLICY "System can update property statistics" ON public.property_statistics
  FOR UPDATE USING (true);

-- Permitir que agentes eliminen estadísticas de sus propiedades
CREATE POLICY "Agents can delete their property statistics" ON public.property_statistics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_statistics.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- 3. Verificar que RLS esté habilitado
ALTER TABLE public.property_statistics ENABLE ROW LEVEL SECURITY;

-- 4. Crear o reemplazar la función de triggers
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

-- 5. Verificar que los triggers estén creados correctamente
-- Eliminar triggers existentes y recrearlos
DROP TRIGGER IF EXISTS trigger_update_property_statistics_views ON public.property_views;
DROP TRIGGER IF EXISTS trigger_update_property_statistics_favorites ON public.property_favorites;
DROP TRIGGER IF EXISTS trigger_update_property_statistics_comments ON public.property_comments;
DROP TRIGGER IF EXISTS trigger_update_property_statistics_inquiries ON public.property_inquiries;

-- Recrear triggers
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

-- 6. Insertar estadísticas para propiedades que no las tengan
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

-- 7. Mostrar información de debug
SELECT 
  'property_statistics policies' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'property_statistics';

-- 8. Verificar que las estadísticas se crearon correctamente
SELECT 
  'property_statistics count' as info,
  COUNT(*) as total_statistics
FROM public.property_statistics;
