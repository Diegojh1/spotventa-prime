-- Asignar todas las propiedades existentes al usuario vendedor
-- y actualizar su perfil para que sea de tipo 'agent'

-- Primero actualizar el perfil del usuario para que sea agente
UPDATE public.profiles 
SET user_type = 'agent', 
    full_name = 'Diego Hernandez',
    company_name = 'SpotVenta Prime',
    phone = '+34 666 123 456'
WHERE id = 'e2c5466f-fb05-4a2c-a9c7-01ad767ed6c3';

-- Asignar todas las propiedades existentes a este usuario
UPDATE public.properties 
SET user_id = 'e2c5466f-fb05-4a2c-a9c7-01ad767ed6c3'
WHERE user_id IS NULL;

-- Crear tabla para estadísticas de propiedades si no existe
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

-- Agregar restricción única a property_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'property_statistics_property_id_key' 
    AND conrelid = 'public.property_statistics'::regclass
  ) THEN
    ALTER TABLE public.property_statistics ADD CONSTRAINT property_statistics_property_id_key UNIQUE (property_id);
  END IF;
END $$;

-- Habilitar RLS para property_statistics
ALTER TABLE public.property_statistics ENABLE ROW LEVEL SECURITY;

-- Políticas para property_statistics
CREATE POLICY "Agents can view their property statistics" ON public.property_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_statistics.property_id 
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update their property statistics" ON public.property_statistics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_statistics.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- Función para actualizar estadísticas automáticamente
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
  IF TG_TABLE_NAME = 'property_favorites' THEN
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
  IF TG_TABLE_NAME = 'property_comments' THEN
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
  IF TG_TABLE_NAME = 'property_inquiries' THEN
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

-- Crear triggers para actualizar estadísticas automáticamente
DROP TRIGGER IF EXISTS trigger_update_property_statistics_views ON public.property_views;
CREATE TRIGGER trigger_update_property_statistics_views
  AFTER INSERT ON public.property_views
  FOR EACH ROW EXECUTE FUNCTION public.update_property_statistics();

DROP TRIGGER IF EXISTS trigger_update_property_statistics_favorites ON public.property_favorites;
CREATE TRIGGER trigger_update_property_statistics_favorites
  AFTER INSERT OR DELETE ON public.property_favorites
  FOR EACH ROW EXECUTE FUNCTION public.update_property_statistics();

DROP TRIGGER IF EXISTS trigger_update_property_statistics_comments ON public.property_comments;
CREATE TRIGGER trigger_update_property_statistics_comments
  AFTER INSERT OR DELETE ON public.property_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_property_statistics();

DROP TRIGGER IF EXISTS trigger_update_property_statistics_inquiries ON public.property_inquiries;
CREATE TRIGGER trigger_update_property_statistics_inquiries
  AFTER INSERT ON public.property_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_property_statistics();

-- Inicializar estadísticas para propiedades existentes
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
ON CONFLICT (property_id) DO NOTHING;
