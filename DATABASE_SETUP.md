# Configuración de la Base de Datos

## Migraciones que necesitas aplicar

Para que la aplicación funcione correctamente con perfiles de usuario, necesitas aplicar las siguientes migraciones a tu base de datos de Supabase:

### 1. Crear tabla de perfiles
Ejecuta el contenido del archivo `supabase/migrations/20250812130000_create_profiles_table.sql` en el SQL Editor de Supabase.

### 2. Crear tablas de interacciones
Ejecuta el contenido del archivo `supabase/migrations/20250812130100_add_property_interactions.sql` en el SQL Editor de Supabase.

### 3. Insertar datos de ejemplo (opcional)
Ejecuta el contenido del archivo `supabase/seed.sql` en el SQL Editor de Supabase.

## Pasos para aplicar las migraciones:

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto: `ppkpllsdwfctxtvjxdmb`
3. Ve a la sección "SQL Editor"
4. Copia y pega cada archivo de migración y ejecútalo

## Verificación

Después de aplicar las migraciones, deberías ver:

1. Una nueva tabla `profiles` en la sección "Table Editor"
2. Nuevas tablas: `property_views`, `property_favorites`, `property_inquiries`
3. Los triggers y funciones correspondientes

## Funcionalidades habilitadas

Una vez aplicadas las migraciones:

- ✅ Registro de usuarios con perfiles
- ✅ Inicio de sesión con información del perfil
- ✅ Página de perfil editable
- ✅ Diferentes funcionalidades para compradores y vendedores
- ✅ Sistema de favoritos
- ✅ Seguimiento de vistas de propiedades
- ✅ Sistema de consultas entre compradores y vendedores

## Notas importantes

- Las migraciones son idempotentes (se pueden ejecutar múltiples veces sin problemas)
- Los datos existentes no se perderán
- Las políticas de seguridad (RLS) están configuradas para proteger los datos
