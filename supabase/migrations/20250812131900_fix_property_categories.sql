-- Verificar y corregir las categorías de las propiedades
-- Asegurar que solo haya 'sale' y 'rent' como valores válidos

-- 1. VERIFICAR VALORES ACTUALES DE CATEGORÍA
SELECT 
  'Current category values' as info,
  category,
  COUNT(*) as count
FROM properties 
GROUP BY category
ORDER BY category;

-- 2. VERIFICAR PROPIEDADES CON CATEGORÍAS INVÁLIDAS
SELECT 
  'Properties with invalid categories' as info,
  id,
  title,
  category,
  property_type,
  price
FROM properties 
WHERE category NOT IN ('sale', 'rent')
ORDER BY category;

-- 3. CORREGIR CATEGORÍAS INVÁLIDAS
-- Si hay propiedades con categorías incorrectas, las corregimos
UPDATE properties 
SET category = 'sale'
WHERE category NOT IN ('sale', 'rent') OR category IS NULL;

-- 4. VERIFICAR RESULTADO
SELECT 
  'Final category values' as info,
  category,
  COUNT(*) as count
FROM properties 
GROUP BY category
ORDER BY category;

-- 5. VERIFICAR QUE NO HAY VALORES NULOS
SELECT 
  'Null categories check' as info,
  COUNT(*) as null_categories
FROM properties 
WHERE category IS NULL;

-- 6. MOSTRAR EJEMPLOS DE PROPIEDADES POR CATEGORÍA
SELECT 
  'Sample properties by category' as info,
  category,
  title,
  price,
  property_type
FROM properties 
ORDER BY category, price DESC
LIMIT 10;
