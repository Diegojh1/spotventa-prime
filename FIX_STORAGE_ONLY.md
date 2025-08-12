# 🔧 Arreglar Sistema de Storage - Instrucciones Específicas

## 🚨 **Problema Identificado:**

Según el debug, el sistema de storage tiene estos problemas:
- **Buckets disponibles:** 0
- **Test subida imagen:** ❌ Falló
- **Bucket property-images:** ❌ No existe
- **Bucket avatars:** ❌ No existe

## 🚀 **Solución:**

### **Paso 1: Aplicar la Migración de Storage**

1. **Ve a Supabase Dashboard > SQL Editor**
2. **Copia y pega** el contenido completo de:
   ```
   supabase/migrations/20250812131100_fix_storage_buckets.sql
   ```
3. **Ejecuta la migración**

### **Paso 2: Verificar que Funcionó**

Después de ejecutar la migración, deberías ver en los resultados:

```
Buckets after fix:
- property-images: ✅ Creado
- avatars: ✅ Creado

Storage policies:
- 8 políticas creadas (4 para cada bucket)
```

### **Paso 3: Probar en la Aplicación**

1. **Ve a tu perfil** en la aplicación
2. **Haz clic en la pestaña "Debug"**
3. **Haz clic en "Re-ejecutar Debug"**
4. **Verifica que ahora muestre:**

   ```
   Sistema de Storage
   Buckets disponibles: 2
   Error buckets: Sin errores
   Bucket property-images: ✅ Existe
   Bucket avatars: ✅ Existe
   Test subida imagen: ✅ Éxito
   ```

### **Paso 4: Probar Funcionalidades**

#### **Subir Foto de Perfil:**
1. Ve a tu perfil
2. Haz clic en el ícono de cámara
3. Selecciona una imagen
4. Debe subirse correctamente

#### **Publicar Propiedad con Imágenes:**
1. Ve a `/publish`
2. Completa el formulario
3. Sube imágenes
4. Publica la propiedad

## 🔍 **Qué Hace la Migración:**

### **1. Verifica Buckets Existentes:**
- Muestra qué buckets hay actualmente

### **2. Limpia Políticas Problemáticas:**
- Elimina políticas RLS que puedan estar causando conflictos

### **3. Crea Buckets Nuevos:**
- `property-images`: Para imágenes de propiedades (50MB máximo)
- `avatars`: Para fotos de perfil (5MB máximo)

### **4. Crea Políticas RLS:**
- **Lectura pública:** Cualquiera puede ver las imágenes
- **Subida:** Usuarios autenticados pueden subir
- **Actualización/Eliminación:** Solo el propietario del archivo

### **5. Verifica la Creación:**
- Confirma que los buckets se crearon
- Confirma que las políticas se aplicaron

## 🆘 **Si Sigue Fallando:**

### **Opción 1: Crear Buckets Manualmente**
1. Ve a **Supabase Dashboard > Storage**
2. Haz clic en **"New bucket"**
3. Crea dos buckets:
   - **ID:** `property-images`, **Public:** ✅
   - **ID:** `avatars`, **Public:** ✅

### **Opción 2: Verificar Permisos**
1. Ve a **Supabase Dashboard > Storage > Policies**
2. Verifica que existan las políticas para `storage.objects`
3. Si no existen, créalas manualmente

### **Opción 3: Verificar Configuración**
1. Ve a **Supabase Dashboard > Settings > API**
2. Verifica que las claves de API estén correctas
3. Verifica que el proyecto esté activo

## 🎯 **Resultado Esperado:**

Después de aplicar la migración:

- ✅ **2 buckets creados** (`property-images` y `avatars`)
- ✅ **8 políticas RLS** configuradas
- ✅ **Subida de imágenes** funcionando
- ✅ **Fotos de perfil** funcionando
- ✅ **Imágenes de propiedades** funcionando

¡El sistema de storage estará completamente operativo! 🚀
