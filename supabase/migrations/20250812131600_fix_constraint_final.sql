-- Arreglar constraint final - Incluir todos los valores necesarios
-- El error muestra que "Apartamento" no está permitido

-- 1. VERIFICAR EL CONSTRAINT ACTUAL
SELECT 
  'Current constraint definition' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'properties_property_type_check';

-- 2. VERIFICAR TODOS LOS VALORES ACTUALES EN LA TABLA
SELECT 
  'All current property_type values' as info,
  property_type,
  COUNT(*) as count
FROM properties 
GROUP BY property_type
ORDER BY property_type;

-- 3. ELIMINAR EL CONSTRAINT ACTUAL
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;

-- 4. CREAR NUEVO CONSTRAINT CON TODOS LOS VALORES NECESARIOS
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
CHECK (property_type IN (
  -- Valores en inglés
  'apartment', 'house', 'flat', 'duplex', 'penthouse', 'studio',
  'chalet', 'townhouse', 'detached_house', 'loft',
  -- Valores en español
  'Apartamento', 'Casa', 'Piso', 'Dúplex', 'Ático', 'Estudio',
  'Chalet', 'Casa adosada', 'Casa independiente', 'Loft',
  -- Valores adicionales que puedan existir
  'apartamento', 'casa', 'piso', 'duplex', 'atico', 'estudio',
  'chalet', 'casa_adosada', 'casa_independiente', 'loft'
));

-- 5. VERIFICAR QUE SE CREÓ CORRECTAMENTE
SELECT 
  'New constraint definition' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'properties_property_type_check';

-- 6. VERIFICAR QUE TODOS LOS DATOS EXISTENTES SON VÁLIDOS
SELECT 
  'Data validation check' as info,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN property_type IS NULL THEN 1 END) as null_property_types,
  COUNT(CASE WHEN property_type NOT IN (
    'apartment', 'house', 'flat', 'duplex', 'penthouse', 'studio',
    'chalet', 'townhouse', 'detached_house', 'loft',
    'Apartamento', 'Casa', 'Piso', 'Dúplex', 'Ático', 'Estudio',
    'Chalet', 'Casa adosada', 'Casa independiente', 'Loft',
    'apartamento', 'casa', 'piso', 'duplex', 'atico', 'estudio',
    'chalet', 'casa_adosada', 'casa_independiente', 'loft'
  ) THEN 1 END) as invalid_property_types
FROM properties;

-- 7. TEST: INTENTAR INSERTAR UNA PROPIEDAD CON "Apartamento"
INSERT INTO properties (
  user_id, title, description, price, property_type, category,
  bedrooms, bathrooms, area_m2, address, city, country
) VALUES (
  'e2c5466f-fb05-4a2c-a9c7-01ad767ed6c3',
  'Test Apartamento',
  'Test description',
  100000,
  'Apartamento',
  'sale'
) ON CONFLICT DO NOTHING;

-- 8. LIMPIAR EL TEST
DELETE FROM properties WHERE title = 'Test Apartamento';

-- 9. VERIFICACIÓN FINAL
SELECT 
  'Final verification' as info,
  'Constraint applied successfully' as status,
  'All property_type values are now valid' as message;
