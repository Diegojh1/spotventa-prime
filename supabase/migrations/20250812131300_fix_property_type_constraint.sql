-- Arreglar check constraint de property_type
-- El problema es que los valores del formulario no coinciden con los permitidos en la base de datos

-- 1. VERIFICAR EL CONSTRAINT ACTUAL
SELECT 
  'Current property_type constraint' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'properties_property_type_check';

-- 2. VERIFICAR VALORES ACTUALES EN LA TABLA
SELECT 
  'Current property_type values' as info,
  property_type,
  COUNT(*) as count
FROM properties 
GROUP BY property_type;

-- 3. ELIMINAR EL CONSTRAINT ACTUAL
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;

-- 4. CREAR NUEVO CONSTRAINT CON VALORES CORRECTOS
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
CHECK (property_type IN (
  'apartment', 'house', 'flat', 'duplex', 'penthouse', 'studio',
  'chalet', 'townhouse', 'detached_house', 'loft',
  'Apartamento', 'Casa', 'Piso', 'Dúplex', 'Ático', 'Estudio',
  'Chalet', 'Casa adosada', 'Casa independiente', 'Loft'
));

-- 5. VERIFICAR QUE SE CREÓ CORRECTAMENTE
SELECT 
  'New property_type constraint' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'properties_property_type_check';

-- 6. VERIFICAR QUE NO HAY DATOS INCONSISTENTES
SELECT 
  'Data validation check' as info,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN property_type IS NULL THEN 1 END) as null_property_types,
  COUNT(CASE WHEN property_type NOT IN (
    'apartment', 'house', 'flat', 'duplex', 'penthouse', 'studio',
    'chalet', 'townhouse', 'detached_house', 'loft',
    'Apartamento', 'Casa', 'Piso', 'Dúplex', 'Ático', 'Estudio',
    'Chalet', 'Casa adosada', 'Casa independiente', 'Loft'
  ) THEN 1 END) as invalid_property_types
FROM properties;
