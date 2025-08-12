# Aplicar Migraciones para Arreglar Filtros

## Problema
Los filtros no funcionan correctamente:
1. Valores mezclados de property_type (inglés/español)
2. Propiedades de alquiler aparecen en venta y viceversa
3. Formularios de edición/publicación no permiten cambiar tipos

## Solución
Ejecutar las migraciones en orden en el Supabase Dashboard.

## Pasos:

### 1. **Ir al Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/ppkpllsdwfctxtvjxdmb
   - Navegar a SQL Editor

### 2. **Ejecutar migración de property_type**
   - Copiar y pegar el contenido de `supabase/migrations/20250812131800_standardize_property_types.sql`
   - Ejecutar el script

### 3. **Ejecutar migración de categorías**
   - Copiar y pegar el contenido de `supabase/migrations/20250812131900_fix_property_categories.sql`
   - Ejecutar el script

### 4. **Verificación final (opcional)**
   - Copiar y pegar el contenido de `supabase/migrations/20250812132100_verify_all_properties.sql`
   - Ejecutar el script para verificar que todo esté correcto

### 5. **Debug (solo si hay problemas)**
   - Si aún hay problemas, ejecutar `supabase/migrations/20250812132000_debug_categories.sql`
   - Esto mostrará el estado actual de las categorías

## Valores finales esperados:

### Property Types (en español):
- Apartamento
- Casa  
- Ático
- Estudio
- Oficina
- Dúplex
- Chalet
- Casa adosada
- Casa independiente
- Loft

### Categories:
- sale (venta)
- rent (alquiler)

## Después de aplicar:
- ✅ Los filtros de tipo de propiedad funcionarán correctamente
- ✅ "Comprar" solo mostrará propiedades de venta
- ✅ "Alquilar" solo mostrará propiedades de alquiler
- ✅ "Todos los tipos" mostrará todas las propiedades de la categoría seleccionada
- ✅ Formularios de edición y publicación permitirán cambiar tipos correctamente
- ✅ Todos los valores estarán estandarizados en español
