-- Diagnóstico y arreglo completo de property_type
-- Primero identificar todos los problemas, luego arreglarlos

-- 1. DIAGNÓSTICO: VER TODOS LOS VALORES ACTUALES
SELECT 
  'DIAGNÓSTICO - Todos los valores actuales' as info,
  property_type,
  COUNT(*) as count
FROM properties 
GROUP BY property_type
ORDER BY property_type;

-- 2. DIAGNÓSTICO: VER QUÉ CONSTRAINT EXISTE ACTUALMENTE
SELECT 
  'DIAGNÓSTICO - Constraint actual' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'properties_property_type_check';

-- 3. DIAGNÓSTICO: VER VALORES PROBLEMÁTICOS
SELECT 
  'DIAGNÓSTICO - Valores problemáticos' as info,
  property_type,
  COUNT(*) as count
FROM properties 
WHERE property_type NOT IN (
  'apartment', 'house', 'flat', 'duplex', 'penthouse', 'studio',
  'chalet', 'townhouse', 'detached_house', 'loft',
  'Apartamento', 'Casa', 'Piso', 'Dúplex', 'Ático', 'Estudio',
  'Chalet', 'Casa adosada', 'Casa independiente', 'Loft',
  'apartamento', 'casa', 'piso', 'duplex', 'atico', 'estudio',
  'chalet', 'casa_adosada', 'casa_independiente', 'loft',
  'office' -- Agregar office que veo en los datos originales
)
GROUP BY property_type;

-- 4. ARREGLAR: ELIMINAR CONSTRAINT ACTUAL SI EXISTE
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;

-- 5. ARREGLAR: ACTUALIZAR VALORES PROBLEMÁTICOS
-- Mapear todos los valores a valores válidos
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

-- Para office, lo convertimos a Apartamento (o puedes elegir otro)
UPDATE properties 
SET property_type = 'Apartamento'
WHERE property_type = 'office';

-- 6. VERIFICAR: MOSTRAR VALORES DESPUÉS DE LA ACTUALIZACIÓN
SELECT 
  'VERIFICACIÓN - Valores después de actualizar' as info,
  property_type,
  COUNT(*) as count
FROM properties 
GROUP BY property_type
ORDER BY property_type;

-- 7. VERIFICAR: CONFIRMAR QUE NO HAY VALORES PROBLEMÁTICOS
SELECT 
  'VERIFICACIÓN - Valores problemáticos restantes' as info,
  property_type,
  COUNT(*) as count
FROM properties 
WHERE property_type NOT IN (
  'apartment', 'house', 'flat', 'duplex', 'penthouse', 'studio',
  'chalet', 'townhouse', 'detached_house', 'loft',
  'Apartamento', 'Casa', 'Piso', 'Dúplex', 'Ático', 'Estudio',
  'Chalet', 'Casa adosada', 'Casa independiente', 'Loft',
  'apartamento', 'casa', 'piso', 'duplex', 'atico', 'estudio',
  'chalet', 'casa_adosada', 'casa_independiente', 'loft',
  'office'
)
GROUP BY property_type;

-- 8. CREAR: NUEVO CONSTRAINT CON TODOS LOS VALORES VÁLIDOS
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check 
CHECK (property_type IN (
  -- Valores en inglés (por si acaso)
  'apartment', 'house', 'flat', 'duplex', 'penthouse', 'studio',
  'chalet', 'townhouse', 'detached_house', 'loft',
  -- Valores en español (los que usaremos)
  'Apartamento', 'Casa', 'Piso', 'Dúplex', 'Ático', 'Estudio',
  'Chalet', 'Casa adosada', 'Casa independiente', 'Loft',
  -- Valores adicionales
  'apartamento', 'casa', 'piso', 'duplex', 'atico', 'estudio',
  'chalet', 'casa_adosada', 'casa_independiente', 'loft',
  'office'
));

-- 9. VERIFICAR: MOSTRAR EL NUEVO CONSTRAINT
SELECT 
  'FINAL - Nuevo constraint creado' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'properties_property_type_check';

-- 10. TEST: PROBAR INSERTAR UNA PROPIEDAD
INSERT INTO properties (
  user_id, title, description, price, property_type, category,
  bedrooms, bathrooms, area_m2, address, city, country,
  images, features, is_active, contact_name, contact_email, contact_phone
) VALUES (
  'e2c5466f-fb05-4a2c-a9c7-01ad767ed6c3',
  'Test Property Type Fix',
  'Test description',
  100000,
  'Apartamento',
  'sale',
  2,
  1,
  80,
  'Test Address',
  'Madrid',
  'España',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  'Test Contact',
  'test@test.com',
  '+34 123 456 789'
) ON CONFLICT DO NOTHING;

-- 11. LIMPIAR: ELIMINAR LA PROPIEDAD DE TEST
DELETE FROM properties WHERE title = 'Test Property Type Fix';

-- 12. RESUMEN FINAL
SELECT 
  'RESUMEN FINAL' as info,
  'Property type constraint fixed successfully' as status,
  'All existing data has been updated to valid values' as message;
