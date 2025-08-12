# Solución para Comentarios y Fotos de Perfil

## Problemas Identificados

1. **Comentarios no aparecen en la web**: La consulta de Supabase tenía una sintaxis incorrecta para el join con la tabla `profiles`
2. **Fotos de perfil no se pueden cambiar**: Los buckets de storage no existían o no tenían las políticas RLS correctas

## Solución Aplicada

### 1. Comentarios Corregidos
- ✅ Corregida la sintaxis de la consulta en `PropertyComments.tsx`
- ✅ Mejorado el manejo de errores

### 2. Storage Buckets Creados
- ✅ Nueva migración que crea automáticamente los buckets `avatars` y `property-images`
- ✅ Políticas RLS configuradas correctamente para ambos buckets
- ✅ Validación de archivos mejorada en el componente de perfil

## Pasos para Aplicar la Solución

### Paso 1: Aplicar la Nueva Migración

Ve a tu **Supabase Dashboard** → **SQL Editor** y ejecuta el contenido del archivo:
```
supabase/migrations/20250812130400_fix_storage_and_comments.sql
```

### Paso 2: Verificar que Funciona

1. **Para comentarios**:
   - Ve a cualquier propiedad
   - Escribe un comentario
   - Debería aparecer inmediatamente en la lista

2. **Para fotos de perfil**:
   - Ve a tu perfil (`/profile`)
   - Haz clic en el ícono de cámara
   - Selecciona una imagen
   - Debería subirse y mostrarse correctamente

## Cambios Técnicos Realizados

### En el Código:
- `src/components/property/PropertyComments.tsx`: Corregida la consulta de Supabase
- `src/pages/Profile.tsx`: Mejorada la validación y manejo de errores para subida de fotos

### En la Base de Datos:
- Creados buckets de storage automáticamente
- Configuradas políticas RLS para acceso seguro
- Asegurada la existencia de constraints de foreign key

## Si Aún Hay Problemas

### Para Comentarios:
1. Verifica en la consola del navegador si hay errores
2. Revisa en Supabase Dashboard → Table Editor → `property_comments` si los comentarios se están guardando
3. Verifica que las políticas RLS estén activas

### Para Fotos:
1. Verifica en Supabase Dashboard → Storage si el bucket `avatars` existe
2. Revisa las políticas RLS del bucket
3. Verifica en la consola del navegador si hay errores de permisos

## Próximos Pasos

Una vez que esto funcione, podemos continuar con:
- Implementar la lista de "Mis Propiedades" para agentes
- Implementar la lista de "Favoritos" para compradores
- Implementar el feed de "Actividad" para ver interacciones
