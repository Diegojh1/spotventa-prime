import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Bug, Database, Shield, Users } from 'lucide-react';

interface CommentsDebugProps {
  propertyId: string;
  user: User | null;
}

export function CommentsDebug({ propertyId, user }: CommentsDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDebugChecks();
  }, [propertyId, user]);

  const runDebugChecks = async () => {
    const info: any = {};

    try {
      // 1. Verificar que la propiedad existe
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id, title, user_id')
        .eq('id', propertyId)
        .single();

      info.property = { data: property, error: propertyError };

      // 2. Verificar el perfil del usuario actual
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        info.userProfile = { data: profile, error: profileError };
      }

      // 3. Verificar comentarios existentes
      const { data: comments, error: commentsError } = await supabase
        .from('property_comments')
        .select('*')
        .eq('property_id', propertyId);

      info.comments = { data: comments, error: commentsError };

      // 4. Verificar políticas RLS (esto requiere permisos de admin)
      info.policies = { error: 'No se pueden verificar políticas desde el cliente' };

      // 5. Intentar insertar un comentario de prueba
      if (user) {
        const testComment = {
          property_id: propertyId,
          user_id: user.id,
          message: `Comentario de prueba - ${new Date().toISOString()}`
        };

        const { data: insertResult, error: insertError } = await supabase
          .from('property_comments')
          .insert(testComment)
          .select()
          .single();

        info.testInsert = { data: insertResult, error: insertError };

        // Si se insertó correctamente, lo eliminamos
        if (insertResult) {
          await supabase
            .from('property_comments')
            .delete()
            .eq('id', insertResult.id);
        }
      }

      // 6. Verificar foreign keys
      info.foreignKeys = { error: 'No se pueden verificar foreign keys desde el cliente' };

    } catch (error) {
      info.generalError = error;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  const formatError = (error: any) => {
    if (!error) return 'Sin errores';
    return `${error.message || error} (${error.code || 'N/A'})`;
  };

  if (loading) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Bug className="h-5 w-5" />
            Debug de Comentarios - Cargando...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-orange-200 rounded w-3/4"></div>
            <div className="h-4 bg-orange-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Bug className="h-5 w-5" />
          Debug de Comentarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button size="sm" onClick={runDebugChecks} variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Re-ejecutar Debug
          </Button>
        </div>

        {/* Información de la propiedad */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            Propiedad
          </h4>
          <div className="text-sm space-y-1">
            <div><strong>ID:</strong> {propertyId}</div>
            <div><strong>Datos:</strong> {debugInfo.property?.data ? JSON.stringify(debugInfo.property.data, null, 2) : 'No encontrada'}</div>
            <div><strong>Error:</strong> {formatError(debugInfo.property?.error)}</div>
          </div>
        </div>

        {/* Información del usuario */}
        {user && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuario Actual
            </h4>
            <div className="text-sm space-y-1">
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Perfil:</strong> {debugInfo.userProfile?.data ? JSON.stringify(debugInfo.userProfile.data, null, 2) : 'No encontrado'}</div>
              <div><strong>Error:</strong> {formatError(debugInfo.userProfile?.error)}</div>
            </div>
          </div>
        )}

        {/* Comentarios existentes */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            Comentarios Existentes
          </h4>
          <div className="text-sm space-y-1">
            <div><strong>Cantidad:</strong> {debugInfo.comments?.data?.length || 0}</div>
            <div><strong>Datos:</strong> {debugInfo.comments?.data ? JSON.stringify(debugInfo.comments.data, null, 2) : 'No hay comentarios'}</div>
            <div><strong>Error:</strong> {formatError(debugInfo.comments?.error)}</div>
          </div>
        </div>

        {/* Test de inserción */}
        {user && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Test de Inserción
            </h4>
            <div className="text-sm space-y-1">
              <div><strong>Resultado:</strong> {debugInfo.testInsert?.data ? '✅ Éxito' : '❌ Falló'}</div>
              <div><strong>Error:</strong> {formatError(debugInfo.testInsert?.error)}</div>
            </div>
          </div>
        )}

        {/* Políticas RLS */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Políticas RLS
          </h4>
          <div className="text-sm space-y-1">
            <div><strong>Estado:</strong> {debugInfo.policies?.error || 'Verificadas'}</div>
            <div><strong>Datos:</strong> {debugInfo.policies?.data ? JSON.stringify(debugInfo.policies.data, null, 2) : 'No disponibles'}</div>
          </div>
        </div>

        {/* Foreign Keys */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            Foreign Keys
          </h4>
          <div className="text-sm space-y-1">
            <div><strong>Estado:</strong> {debugInfo.foreignKeys?.error || 'Verificadas'}</div>
            <div><strong>Datos:</strong> {debugInfo.foreignKeys?.data ? JSON.stringify(debugInfo.foreignKeys.data, null, 2) : 'No disponibles'}</div>
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-semibold mb-2">Resumen del Problema:</h4>
          <div className="text-sm space-y-1">
            {debugInfo.comments?.error && (
              <div className="text-red-600">❌ Error al cargar comentarios: {formatError(debugInfo.comments.error)}</div>
            )}
            {debugInfo.testInsert?.error && (
              <div className="text-red-600">❌ Error al insertar comentario: {formatError(debugInfo.testInsert.error)}</div>
            )}
            {!debugInfo.comments?.error && !debugInfo.testInsert?.error && (
              <div className="text-green-600">✅ Sistema de comentarios funcionando correctamente</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
