-- Verificación final: Asegurar que todas las propiedades tengan valores válidos
-- Después de aplicar las migraciones anteriores

-- 1. VERIFICAR ESTADO FINAL DE PROPERTY_TYPES
SELECT 
  'Final property_type verification' as info,
  property_type,
  COUNT(*) as count
FROM properties 
GROUP BY property_type
ORDER BY property_type;

-- 2. VERIFICAR ESTADO FINAL DE CATEGORIES
SELECT 
  'Final category verification' as info,
  category,
  COUNT(*) as count
FROM properties 
GROUP BY category
ORDER BY category;

-- 3. VERIFICAR PROPIEDADES ACTIVAS POR CATEGORÍA Y TIPO
SELECT 
  'Active properties by category and type' as info,
  category,
  property_type,
  COUNT(*) as count
FROM properties 
WHERE is_active = true
GROUP BY category, property_type
ORDER BY category, property_type;

-- 4. MOSTRAR EJEMPLOS DE PROPIEDADES DE CADA CATEGORÍA
SELECT 
  'Sample sale properties' as info,
  id,
  title,
  property_type,
  price,
  city
FROM properties 
WHERE category = 'sale' AND is_active = true
ORDER BY price DESC
LIMIT 5;

SELECT 
  'Sample rent properties' as info,
  id,
  title,
  property_type,
  price,
  city
FROM properties 
WHERE category = 'rent' AND is_active = true
ORDER BY price DESC
LIMIT 5;

-- 5. VERIFICAR QUE NO HAY VALORES INVÁLIDOS
SELECT 
  'Invalid values check' as info,
  COUNT(CASE WHEN property_type NOT IN (
    'Apartamento', 'Casa', 'Ático', 'Estudio', 'Oficina', 'Dúplex',
    'Chalet', 'Casa adosada', 'Casa independiente', 'Loft'
  ) THEN 1 END) as invalid_property_types,
  COUNT(CASE WHEN category NOT IN ('sale', 'rent') THEN 1 END) as invalid_categories,
  COUNT(CASE WHEN property_type IS NULL THEN 1 END) as null_property_types,
  COUNT(CASE WHEN category IS NULL THEN 1 END) as null_categories
FROM properties;

-- 6. RESUMEN FINAL
SELECT 
  'Final summary' as info,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_properties,
  COUNT(CASE WHEN category = 'sale' THEN 1 END) as sale_properties,
  COUNT(CASE WHEN category = 'rent' THEN 1 END) as rent_properties
FROM properties;
