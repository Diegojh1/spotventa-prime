# Migraciones Supabase - SpotVenta

## 📋 Migraciones Pendientes

Para que SpotVenta funcione completamente, necesitas aplicar las siguientes migraciones en tu proyecto de Supabase:

### 1. Sistema de Notificaciones
**Archivo**: `supabase/migrations/20250812132300_add_notification_read_status.sql`
- Agrega campo `is_read` a las tablas de notificaciones
- Crea función `mark_notifications_as_read`

### 2. Sistema de Chat Mejorado
**Archivo**: `supabase/migrations/20250812132400_improve_chat_system.sql`
- Agrega campo `chat_id` a `direct_messages`
- Crea tabla `message_threads`
- Crea función `get_or_create_chat_id`

### 3. Fix del Trigger de Chat
**Archivo**: `supabase/migrations/20250812132500_fix_chat_trigger.sql`
- Arregla el trigger `handle_new_message`
- Mejora la función `get_or_create_chat_id`

### 4. Bucket de Avatars
**Archivo**: `supabase/migrations/20250812132600_create_avatars_bucket.sql`
- Crea bucket `avatars` en Storage
- Configura políticas RLS para avatars

### 5. Campos de Perfil
**Archivo**: `supabase/migrations/20250812132700_add_profile_fields.sql`
- Agrega campos `phone` y `bio` a tabla `profiles`

## 🚀 Cómo Aplicar las Migraciones

1. **Ve a tu proyecto de Supabase**
   - Dashboard → Tu Proyecto → SQL Editor

2. **Aplica cada migración en orden**
   - Copia y pega el contenido de cada archivo
   - Ejecuta el SQL
   - Verifica que no haya errores

3. **Verifica las tablas creadas**
   - Ve a Database → Tables
   - Confirma que todas las tablas existen

## ✅ Verificación

Después de aplicar todas las migraciones, deberías tener:

### Tablas Principales
- ✅ `profiles` (con campos phone, bio)
- ✅ `properties`
- ✅ `property_views`
- ✅ `property_favorites` (con is_read)
- ✅ `property_comments`
- ✅ `property_comment_replies` (con is_read)
- ✅ `direct_messages` (con chat_id)
- ✅ `message_threads`
- ✅ `property_statistics_detailed`

### Funciones
- ✅ `mark_notifications_as_read`
- ✅ `get_or_create_chat_id`
- ✅ `handle_new_message` (trigger)

### Storage Buckets
- ✅ `avatars` (con políticas RLS)

## 🔧 Troubleshooting

Si encuentras errores:

1. **Verifica que las migraciones se ejecuten en orden**
2. **Revisa los logs de error en Supabase**
3. **Asegúrate de que no haya conflictos de nombres**
4. **Verifica que tengas permisos de administrador**

## 📞 Soporte

Si necesitas ayuda con las migraciones, revisa:
- Logs de Supabase Dashboard
- Documentación de Supabase
- Consola del navegador para errores del frontend
