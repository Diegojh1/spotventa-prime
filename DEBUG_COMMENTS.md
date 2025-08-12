# Debug de Comentarios - Instrucciones

## Problema
Los comentarios se guardan en la base de datos pero no aparecen en la web.

## Solución Implementada

### 1. Componente de Debug Agregado
- ✅ Agregado `CommentsDebug` en la página de detalles de propiedad
- ✅ Mejorado el logging en `PropertyComments.tsx`
- ✅ Creada nueva migración para arreglar políticas RLS

### 2. Pasos para Depurar

#### Paso 1: Aplicar la Nueva Migración
Ve a tu **Supabase Dashboard** → **SQL Editor** y ejecuta:
```
supabase/migrations/20250812130500_fix_comments_policies.sql
```

#### Paso 2: Usar el Componente de Debug
1. Ve a cualquier propiedad en tu aplicación (`http://localhost:8081/`)
2. Baja hasta la sección de comentarios
3. Verás un nuevo componente naranja "Debug de Comentarios"
4. Haz clic en "Ejecutar Debug"
5. Revisa la información que aparece

#### Paso 3: Revisar la Consola del Navegador
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña "Console"
3. Navega a una propiedad
4. Busca los logs que empiezan con:
   - "Fetching comments for property:"
   - "Simple query result:"
   - "Full query result:"
   - "Formatted comments:"

## Información que el Debug Proporciona

El componente de debug verificará:
- ✅ Si la propiedad existe
- ✅ Si el usuario existe en la tabla `profiles`
- ✅ Si hay comentarios en la base de datos
- ✅ Si las políticas RLS están funcionando
- ✅ Si se puede insertar un comentario de prueba

## Posibles Problemas y Soluciones

### Problema 1: No hay comentarios en la base de datos
**Solución**: El debug insertará un comentario de prueba automáticamente.

### Problema 2: Error en la consulta con join
**Solución**: La migración arregla las constraints de foreign key.

### Problema 3: Políticas RLS bloqueando el acceso
**Solución**: La migración recrea las políticas correctamente.

### Problema 4: El usuario no existe en la tabla `profiles`
**Solución**: Verifica que el trigger de creación de perfil funcione.

## Próximos Pasos

Una vez que ejecutes el debug, comparte conmigo:
1. La información que aparece en el componente de debug
2. Los logs de la consola del navegador
3. Cualquier error que veas

Con esa información podré identificar exactamente qué está causando el problema.
