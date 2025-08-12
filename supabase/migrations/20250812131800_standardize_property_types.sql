-- Estandarizar todos los valores de property_type a español
-- Esto asegura que todos los filtros funcionen correctamente

-- 1. VERIFICAR VALORES ACTUALES
SELECT 
  'Current property_type values' as info,
  property_type,
  COUNT(*) as count
FROM properties 
GROUP BY property_type
ORDER BY property_type;

-- 2. CONVERTIR TODOS LOS VALORES A ESPAÑOL
UPDATE properties 
SET property_type = 'Apartamento'
WHERE property_type IN ('apartment', 'flat', 'piso');

UPDATE properties 
SET property_type = 'Casa'
WHERE property_type IN ('house', 'home', 'casa');

UPDATE properties 
SET property_type = 'Ático'
WHERE property_type IN ('penthouse', 'atico', 'attico');

UPDATE properties 
SET property_type = 'Estudio'
WHERE property_type IN ('studio', 'estudio');

UPDATE properties 
SET property_type = 'Oficina'
WHERE property_type IN ('office', 'oficina');

UPDATE properties 
SET property_type = 'Dúplex'
WHERE property_type IN ('duplex', 'duplex');

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

-- 3. VERIFICAR RESULTADO
SELECT 
  'Final property_type values' as info,
  property_type,
  COUNT(*) as count
FROM properties 
GROUP BY property_type
ORDER BY property_type;

-- 4. ACTUALIZAR CONSTRAINT PARA SOLO PERMITIR VALORES EN ESPAÑOL
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;

ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
CHECK (property_type IN (
  'Apartamento', 'Casa', 'Ático', 'Estudio', 'Oficina', 'Dúplex',
  'Chalet', 'Casa adosada', 'Casa independiente', 'Loft'
));

-- 5. VERIFICACIÓN FINAL
SELECT 
  'Constraint verification' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'properties_property_type_check';

SELECT 
  'Final data validation' as info,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN property_type IS NULL THEN 1 END) as null_property_types,
  COUNT(CASE WHEN property_type NOT IN (
    'Apartamento', 'Casa', 'Ático', 'Estudio', 'Oficina', 'Dúplex',
    'Chalet', 'Casa adosada', 'Casa independiente', 'Loft'
  ) THEN 1 END) as invalid_property_types
FROM properties;
