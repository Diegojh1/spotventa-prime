# 🔧 Arreglar Sistema de Comentarios

## 🚨 Problema Identificado

El sistema de comentarios se dañó después del cambio de ownership de las propiedades. Esto puede deberse a:

1. **Políticas RLS restrictivas** que no permiten ver comentarios
2. **Foreign keys rotas** después del cambio de ownership
3. **Permisos de usuario** que cambiaron con el nuevo sistema

## ✅ Solución Paso a Paso

### 1. Aplicar la Migración de Reparación

Ejecuta esta migración en **Supabase Dashboard > SQL Editor**:

```sql
-- Archivo: supabase/migrations/20250812130800_fix_comments_policies.sql
```

Esta migración:
- ✅ Elimina políticas RLS problemáticas
- ✅ Crea políticas más permisivas para comentarios
- ✅ Verifica y repara foreign keys
- ✅ Inserta un comentario de prueba

### 2. Verificar el Estado

Después de aplicar la migración, ejecuta estas consultas para verificar:

```sql
-- Verificar comentarios existentes
SELECT * FROM property_comments LIMIT 5;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'property_comments';

-- Verificar foreign keys
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='property_comments';
```

### 3. Usar el Componente de Debug

El componente `CommentsDebug` te ayudará a diagnosticar problemas:

1. **Ve a cualquier página de propiedad** (ej: `/property/[id]`)
2. **Busca la sección "Debug de Comentarios"** (tarjeta naranja)
3. **Revisa la información** que muestra:
   - Estado de la propiedad
   - Perfil del usuario actual
   - Comentarios existentes
   - Test de inserción
   - Errores específicos

### 4. Verificar en el Frontend

1. **Abre la consola del navegador** (F12)
2. **Ve a una página de propiedad**
3. **Busca logs** relacionados con comentarios
4. **Revisa errores** en la consola

## 🔍 Diagnóstico de Problemas Comunes

### Error: "new row violates row-level security policy"

**Causa**: Políticas RLS muy restrictivas
**Solución**: Aplicar la migración de reparación

### Error: "insert or update on table violates foreign key constraint"

**Causa**: Foreign keys rotas
**Solución**: La migración repara automáticamente las foreign keys

### Error: "permission denied for table property_comments"

**Causa**: Permisos de usuario incorrectos
**Solución**: Verificar que el usuario esté autenticado y tenga perfil

### Los comentarios no aparecen

**Causa**: Política RLS de SELECT muy restrictiva
**Solución**: La nueva política permite ver todos los comentarios

## 🧪 Test Manual

Para probar manualmente:

1. **Inicia sesión** con una cuenta
2. **Ve a una propiedad** que tenga comentarios
3. **Verifica que los comentarios aparezcan**
4. **Intenta agregar un nuevo comentario**
5. **Verifica que se guarde y aparezca**

## 📋 Checklist de Verificación

- [ ] Migración aplicada sin errores
- [ ] Comentarios existentes se muestran
- [ ] Se pueden agregar nuevos comentarios
- [ ] No hay errores en la consola del navegador
- [ ] El componente de debug muestra "✅ Sistema funcionando"

## 🆘 Si el Problema Persiste

Si después de aplicar la migración el problema continúa:

1. **Revisa los logs** del componente de debug
2. **Verifica la consola** del navegador
3. **Comprueba que el usuario esté autenticado**
4. **Verifica que la propiedad exista**
5. **Contacta soporte** con los logs de debug

## 🎯 Resultado Esperado

Después de aplicar la solución:

- ✅ Los comentarios existentes se muestran correctamente
- ✅ Los usuarios pueden agregar nuevos comentarios
- ✅ No hay errores de permisos
- ✅ El sistema funciona como antes del cambio de ownership

¡El sistema de comentarios debería estar funcionando correctamente! 🚀
