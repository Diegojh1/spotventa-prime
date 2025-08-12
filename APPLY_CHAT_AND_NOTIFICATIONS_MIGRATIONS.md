# Aplicar Migraciones: Chat ID y Notificaciones

## 📋 **Descripción**
Estas migraciones implementan un sistema de chat mejorado con chat_id único para cada conversación y un sistema de notificaciones persistente con estado de lectura.

## 🗄️ **Migraciones a Aplicar**

### 1. **Migración de Chat ID** (`20250812132400_improve_chat_system.sql`)
- Agrega columna `chat_id` a `direct_messages` y `message_threads`
- Crea funciones para manejar chat_id automáticamente
- Mejora la lógica de conversaciones

### 2. **Migración de Estado de Lectura** (`20250812132300_add_notification_read_status.sql`)
- Agrega columna `is_read` a tablas de notificaciones
- Crea función `mark_notifications_as_read`

## 📝 **Instrucciones para Aplicar**

### 1. **Ir al Supabase Dashboard**
- Ve a [supabase.com](https://supabase.com)
- Inicia sesión en tu cuenta
- Selecciona tu proyecto: `ppkpllsdwfctxtvjxdmb`

### 2. **Aplicar Migración de Chat ID**
- En el menú lateral, haz clic en **"SQL Editor"**
- Haz clic en **"New query"**
- Copia y pega todo el contenido del archivo:
  ```
  supabase/migrations/20250812132400_improve_chat_system.sql
  ```
- Haz clic en **"Run"** para ejecutar la migración

### 3. **Aplicar Migración de Notificaciones**
- Haz clic en **"New query"** nuevamente
- Copia y pega todo el contenido del archivo:
  ```
  supabase/migrations/20250812132300_add_notification_read_status.sql
  ```
- Haz clic en **"Run"** para ejecutar la migración

### 4. **Verificar la Aplicación**
- Ve a **"Table Editor"** en el menú lateral
- Verifica que las tablas tengan las nuevas columnas:
  - `direct_messages` debe tener `chat_id`
  - `message_threads` debe tener `chat_id`
  - `property_favorites` debe tener `is_read`
  - `property_inquiries` debe tener `is_read`
  - `property_comment_replies` debe tener `is_read`
  - `direct_messages` debe tener `is_read`

## ✅ **Problemas Solucionados**

### **Chat System:**
- ✅ Chat ID único para cada conversación
- ✅ Mejor lógica de mensajes entre compradores y vendedores
- ✅ Funciona tanto para compradores como para vendedores
- ✅ Evita "chats infinitos" con la misma persona

### **Notificaciones:**
- ✅ Estado de lectura persistente en la base de datos
- ✅ No aparecen como nuevas después de refrescar
- ✅ Solo notifican acciones de otros usuarios (no propias)
- ✅ Notificaciones para respuestas a comentarios y mensajes privados
- ✅ Se marcan como leídas al abrir el dropdown

### **Perfil:**
- ✅ Estadísticas solo para vendedores (agents)
- ✅ Chat funciona para compradores y vendedores
- ✅ Mejor lógica de conversaciones

## 🔧 **Funcionalidades Mejoradas**
- ✅ Sistema de chat con chat_id único
- ✅ Notificaciones persistentes con estado de lectura
- ✅ Mejor lógica de roles (comprador/vendedor)
- ✅ Estadísticas solo para vendedores
- ✅ Chat accesible desde perfil para ambos tipos de usuario
