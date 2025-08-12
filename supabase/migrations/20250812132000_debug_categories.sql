-- Debug: Verificar el estado actual de las categorías
-- Esto nos ayudará a entender por qué aparecen propiedades de alquiler en venta

-- 1. VER TODAS LAS PROPIEDADES CON SUS CATEGORÍAS
SELECT 
  'All properties with categories' as info,
  id,
  title,
  category,
  property_type,
  price,
  is_active
FROM properties 
ORDER BY category, price DESC;

-- 2. CONTAR PROPIEDADES POR CATEGORÍA
SELECT 
  'Count by category' as info,
  category,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_properties
FROM properties 
GROUP BY category
ORDER BY category;

-- 3. VER PROPIEDADES ACTIVAS POR CATEGORÍA
SELECT 
  'Active properties by category' as info,
  category,
  COUNT(*) as count
FROM properties 
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- 4. VER PROPIEDADES DE VENTA ACTIVAS
SELECT 
  'Sale properties (active)' as info,
  id,
  title,
  property_type,
  price
FROM properties 
WHERE category = 'sale' AND is_active = true
ORDER BY price DESC;

-- 5. VER PROPIEDADES DE ALQUILER ACTIVAS
SELECT 
  'Rent properties (active)' as info,
  id,
  title,
  property_type,
  price
FROM properties 
WHERE category = 'rent' AND is_active = true
ORDER BY price DESC;

-- 6. VERIFICAR SI HAY PROPIEDADES CON CATEGORÍAS INVÁLIDAS
SELECT 
  'Invalid categories' as info,
  category,
  COUNT(*) as count
FROM properties 
WHERE category NOT IN ('sale', 'rent')
GROUP BY category;
