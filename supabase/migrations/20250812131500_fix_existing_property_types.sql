-- Arreglar datos existentes antes de aplicar el constraint
-- El error indica que hay filas que violan el constraint

-- 1. VERIFICAR DATOS PROBLEMÁTICOS
SELECT 
  'Problematic property_type values' as info,
  property_type,
  COUNT(*) as count
FROM properties 
WHERE property_type NOT IN (
  'apartment', 'house', 'flat', 'duplex', 'penthouse', 'studio',
  'chalet', 'townhouse', 'detached_house', 'loft',
  'Apartamento', 'Casa', 'Piso', 'Dúplex', 'Ático', 'Estudio',
  'Chalet', 'Casa adosada', 'Casa independiente', 'Loft'
)
GROUP BY property_type;

-- 2. VERIFICAR TODOS LOS VALORES ACTUALES
SELECT 
  'All current property_type values' as info,
  property_type,
  COUNT(*) as count
FROM properties 
GROUP BY property_type
ORDER BY property_type;

-- 3. ACTUALIZAR VALORES PROBLEMÁTICOS
-- Mapear valores incorrectos a valores válidos
UPDATE properties 
SET property_type = 'Apartamento'
WHERE property_type IN ('apartment', 'flat', 'piso');

UPDATE properties 
SET property_type = 'Casa'
WHERE property_type IN ('house', 'home', 'casa');

UPDATE properties 
SET property_type = 'Dúplex'
WHERE property_type IN ('duplex', 'duplex');

UPDATE properties 
SET property_type = 'Ático'
WHERE property_type IN ('penthouse', 'atico', 'attico');

UPDATE properties 
SET property_type = 'Estudio'
WHERE property_type IN ('studio', 'estudio');

UPDATE properties 
SET property_type = 'Chalet'
WHERE property_type IN ('chalet', 'chalet');

UPDATE properties 
SET property_type = 'Casa adosada'
WHERE property_type IN ('townhouse', 'casa_adosada', 'casa adosada');

UPDATE properties 
SET property_type = 'Casa independiente'
WHERE property_type IN ('detached_house', 'casa_independiente', 'casa independiente');

UPDATE properties 
SET property_type = 'Loft'
WHERE property_type IN ('loft', 'loft');

-- 4. VERIFICAR QUE NO QUEDEN VALORES PROBLEMÁTICOS
SELECT 
  'Remaining problematic values' as info,
  property_type,
  COUNT(*) as count
FROM properties 
WHERE property_type NOT IN (
  'apartment', 'house', 'flat', 'duplex', 'penthouse', 'studio',
  'chalet', 'townhouse', 'detached_house', 'loft',
  'Apartamento', 'Casa', 'Piso', 'Dúplex', 'Ático', 'Estudio',
  'Chalet', 'Casa adosada', 'Casa independiente', 'Loft'
)
GROUP BY property_type;

-- 5. VERIFICAR VALORES FINALES
SELECT 
  'Final property_type values' as info,
  property_type,
  COUNT(*) as count
FROM properties 
GROUP BY property_type
ORDER BY property_type;
