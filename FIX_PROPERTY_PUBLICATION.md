# 🔧 Arreglar Publicación de Propiedades

## 🚨 **Problemas Identificados:**

1. **Error de constraint:** `new row for relation "properties" violates check constraint "properties_property_type_check"`
2. **Buckets de storage no existen:** `Bucket property-images: ❌ No existe`, `Bucket avatars: ❌ No existe`

## 🚀 **Solución Paso a Paso:**

### **Paso 1: Diagnóstico y Arreglo Completo**

1. **Ve a Supabase Dashboard > SQL Editor**
2. **Copia y pega** el contenido completo de:
   ```
   supabase/migrations/20250812131700_diagnose_and_fix_property_types.sql
   ```
3. **Ejecuta la migración**

**Esta migración hará:**
- ✅ **Diagnóstico** de todos los valores actuales
- ✅ **Identificación** de valores problemáticos
- ✅ **Actualización** de todos los datos a valores válidos
- ✅ **Creación** del constraint correcto
- ✅ **Prueba** de que funciona

**Resultado esperado:**
```
DIAGNÓSTICO - Todos los valores actuales: [valores actuales]
DIAGNÓSTICO - Valores problemáticos: [valores problemáticos]
VERIFICACIÓN - Valores después de actualizar: [valores corregidos]
FINAL - Nuevo constraint creado: [constraint nuevo]
RESUMEN FINAL: Property type constraint fixed successfully
```

### **Paso 2: Crear los Buckets de Storage**

1. **En el mismo SQL Editor**
2. **Copia y pega** el contenido completo de:
   ```
   supabase/migrations/20250812131900_create_storage_buckets_final.sql
   ```
3. **Ejecuta la migración**

**Resultado esperado:**
```
Current buckets: [buckets actuales]
Final verification: Buckets created: 2
Storage policies count: 8
```

### **Paso 3: Verificar en la Aplicación**

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

### **Paso 4: Probar Publicación**

1. **Ve a `/publish`**
2. **Completa el formulario** con todos los campos
3. **Sube algunas imágenes**
4. **Haz clic en "Publicar Propiedad"**
5. **Debería funcionar sin errores**

## 🔍 **Qué Hacen las Migraciones:**

### **Migración 1: Fix Property Type Constraint**
- ✅ **Verifica** el constraint actual
- ✅ **Elimina** el constraint problemático
- ✅ **Crea** nuevo constraint con valores correctos
- ✅ **Valida** que no hay datos inconsistentes

### **Migración 2: Fix Storage Buckets**
- ✅ **Elimina** buckets problemáticos
- ✅ **Crea** bucket `property-images` (50MB)
- ✅ **Crea** bucket `avatars` (5MB)
- ✅ **Configura** políticas RLS para ambos buckets
- ✅ **Verifica** que todo se creó correctamente

## 🎯 **Valores Permitidos para Property Type:**

Después de la migración, estos valores serán válidos:

**En inglés:**
- `apartment`, `house`, `flat`, `duplex`, `penthouse`, `studio`
- `chalet`, `townhouse`, `detached_house`, `loft`

**En español:**
- `Apartamento`, `Casa`, `Piso`, `Dúplex`, `Ático`, `Estudio`
- `Chalet`, `Casa adosada`, `Casa independiente`, `Loft`

## 📋 **Checklist de Verificación:**

- [ ] Migración 1 aplicada sin errores
- [ ] Migración 2 aplicada sin errores
- [ ] Debug tool muestra "Buckets disponibles: 2"
- [ ] Debug tool muestra "Bucket property-images: ✅ Existe"
- [ ] Debug tool muestra "Bucket avatars: ✅ Existe"
- [ ] Debug tool muestra "Test subida imagen: ✅ Éxito"
- [ ] Se puede publicar una propiedad sin errores
- [ ] Se pueden subir imágenes en la publicación

## 🆘 **Si Sigue Fallando:**

### **Error de Constraint:**
- Verifica que la migración 1 se ejecutó completamente
- Revisa los logs de la migración para confirmar

### **Error de Storage:**
- Verifica que la migración 2 se ejecutó completamente
- Ve a **Supabase Dashboard > Storage** y confirma que aparecen los buckets

### **Otro Error:**
- Comparte el error específico que aparece
- Revisa la consola del navegador para logs detallados

¡Aplica ambas migraciones y el sistema de publicación estará completamente funcional! 🚀
