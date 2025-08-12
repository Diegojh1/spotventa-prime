import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bug, 
  Database, 
  Shield, 
  Users, 
  Image, 
  BarChart3, 
  Home,
  Upload,
  Eye
} from 'lucide-react';

interface SystemDebugProps {
  user: User | null;
}

export function SystemDebug({ user }: SystemDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runSystemChecks();
  }, [user]);

  const runSystemChecks = async () => {
    const info: any = {};

    try {
      // 1. Verificar perfil del usuario
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        info.userProfile = { data: profile, error: profileError };
      }

      // 2. Verificar propiedades del usuario
      if (user) {
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('user_id', user.id);

        info.userProperties = { data: properties, error: propertiesError };
      }

      // 3. Verificar todas las propiedades activas
      const { data: allProperties, error: allPropertiesError } = await supabase
        .from('properties')
        .select('id, title, user_id, is_active')
        .eq('is_active', true);

      info.allProperties = { data: allProperties, error: allPropertiesError };

      // 4. Verificar estadísticas
      const { data: statistics, error: statisticsError } = await supabase
        .from('property_statistics')
        .select('*')
        .limit(5);

      info.statistics = { data: statistics, error: statisticsError };

             // 5. Verificar storage buckets
       try {
         const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
         info.storageBuckets = { data: buckets, error: bucketsError };
         
         // Verificar buckets específicos
         const propertyImagesBucket = buckets?.find(b => b.id === 'property-images');
         const avatarsBucket = buckets?.find(b => b.id === 'avatars');
         
         info.storageDetails = {
           propertyImagesBucket: propertyImagesBucket ? '✅ Existe' : '❌ No existe',
           avatarsBucket: avatarsBucket ? '✅ Existe' : '❌ No existe',
           totalBuckets: buckets?.length || 0
         };
       } catch (e) {
         info.storageBuckets = { error: 'No se pueden verificar buckets de storage' };
         info.storageDetails = { error: 'Error al verificar buckets específicos' };
       }

      // 6. Test de inserción de propiedad (solo para agentes)
      if (user && info.userProfile?.data?.user_type === 'agent') {
        const testProperty = {
          title: `Test Property - ${new Date().toISOString()}`,
          description: 'Propiedad de prueba para verificar el sistema',
          price: 100000,
          property_type: 'apartment',
          category: 'sale',
          bedrooms: 2,
          bathrooms: 1,
          area_m2: 80,
          address: 'Calle de Prueba, 123',
          city: 'Madrid',
          country: 'España',
          images: [],
          features: ['Test feature'],
          amenities: [],
          contact_name: 'Test Contact',
          contact_phone: '+34 666 123 456',
          contact_email: 'test@example.com',
          is_active: true,
          user_id: user.id
        };

        const { data: insertResult, error: insertError } = await supabase
          .from('properties')
          .insert(testProperty)
          .select()
          .single();

        info.testPropertyInsert = { data: insertResult, error: insertError };

        // Si se insertó correctamente, lo eliminamos
        if (insertResult) {
          await supabase
            .from('properties')
            .delete()
            .eq('id', insertResult.id);
        }
      }

             // 7. Test de subida de imagen
       if (user) {
         try {
           // Crear un archivo de imagen de prueba (1x1 pixel PNG)
           const pngData = new Uint8Array([
             0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
             0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
             0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
             0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
             0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
             0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
           ]);
           
           const testFile = new File([pngData], 'test.png', { type: 'image/png' });
           const filePath = `${user.id}/test-${Date.now()}.png`;

           const { data: uploadResult, error: uploadError } = await supabase.storage
             .from('property-images')
             .upload(filePath, testFile);

           info.testImageUpload = { data: uploadResult, error: uploadError };

           // Si se subió correctamente, lo eliminamos
           if (uploadResult) {
             await supabase.storage
               .from('property-images')
               .remove([filePath]);
           }
         } catch (e) {
           info.testImageUpload = { error: 'Error en test de subida de imagen' };
         }
       }

      // 8. Verificar comentarios
      const { data: comments, error: commentsError } = await supabase
        .from('property_comments')
        .select('*')
        .limit(5);

      info.comments = { data: comments, error: commentsError };

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

  const getStatusColor = (hasError: boolean) => {
    return hasError ? 'text-red-600' : 'text-green-600';
  };

  if (loading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Bug className="h-5 w-5" />
            Debug del Sistema - Cargando...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-blue-200 rounded w-3/4"></div>
            <div className="h-4 bg-blue-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Bug className="h-5 w-5" />
          Debug Completo del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Button size="sm" onClick={runSystemChecks} variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Re-ejecutar Debug
          </Button>
        </div>

        {/* Perfil del Usuario */}
        {user && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Perfil del Usuario
            </h4>
            <div className="text-sm space-y-1">
              <div><strong>ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Tipo:</strong> {debugInfo.userProfile?.data?.user_type || 'No definido'}</div>
              <div><strong>Error:</strong> {formatError(debugInfo.userProfile?.error)}</div>
            </div>
          </div>
        )}

        {/* Propiedades */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Home className="h-4 w-4" />
            Sistema de Propiedades
          </h4>
          <div className="text-sm space-y-1">
            <div><strong>Propiedades activas totales:</strong> {debugInfo.allProperties?.data?.length || 0}</div>
            <div><strong>Mis propiedades:</strong> {debugInfo.userProperties?.data?.length || 0}</div>
            <div><strong>Error propiedades:</strong> {formatError(debugInfo.allProperties?.error)}</div>
            {user && debugInfo.userProfile?.data?.user_type === 'agent' && (
              <div className={`font-semibold ${getStatusColor(!!debugInfo.testPropertyInsert?.error)}`}>
                Test inserción propiedad: {debugInfo.testPropertyInsert?.error ? '❌ Falló' : '✅ Éxito'}
              </div>
            )}
          </div>
        </div>

                 {/* Storage */}
         <div className="space-y-2">
           <h4 className="font-semibold flex items-center gap-2">
             <Image className="h-4 w-4" />
             Sistema de Storage
           </h4>
           <div className="text-sm space-y-1">
             <div><strong>Buckets disponibles:</strong> {debugInfo.storageBuckets?.data?.length || 0}</div>
             <div><strong>Error buckets:</strong> {formatError(debugInfo.storageBuckets?.error)}</div>
             {debugInfo.storageDetails && !debugInfo.storageDetails.error && (
               <>
                 <div><strong>Bucket property-images:</strong> {debugInfo.storageDetails.propertyImagesBucket}</div>
                 <div><strong>Bucket avatars:</strong> {debugInfo.storageDetails.avatarsBucket}</div>
               </>
             )}
             <div className={`font-semibold ${getStatusColor(!!debugInfo.testImageUpload?.error)}`}>
               Test subida imagen: {debugInfo.testImageUpload?.error ? '❌ Falló' : '✅ Éxito'}
             </div>
             {debugInfo.testImageUpload?.error && (
               <div className="text-xs text-red-600 mt-1">
                 Error: {formatError(debugInfo.testImageUpload?.error)}
               </div>
             )}
           </div>
         </div>

        {/* Estadísticas */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Sistema de Estadísticas
          </h4>
          <div className="text-sm space-y-1">
            <div><strong>Estadísticas creadas:</strong> {debugInfo.statistics?.data?.length || 0}</div>
            <div><strong>Error estadísticas:</strong> {formatError(debugInfo.statistics?.error)}</div>
          </div>
        </div>

        {/* Comentarios */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Sistema de Comentarios
          </h4>
          <div className="text-sm space-y-1">
            <div><strong>Comentarios existentes:</strong> {debugInfo.comments?.data?.length || 0}</div>
            <div><strong>Error comentarios:</strong> {formatError(debugInfo.comments?.error)}</div>
          </div>
        </div>

        {/* Resumen General */}
        <div className="mt-6 p-4 bg-white rounded border">
          <h4 className="font-semibold mb-3">Resumen del Estado del Sistema:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className={`${getStatusColor(!!debugInfo.allProperties?.error)}`}>
              <strong>Propiedades:</strong> {debugInfo.allProperties?.error ? '❌ Error' : '✅ Funcionando'}
            </div>
            <div className={`${getStatusColor(!!debugInfo.storageBuckets?.error)}`}>
              <strong>Storage:</strong> {debugInfo.storageBuckets?.error ? '❌ Error' : '✅ Funcionando'}
            </div>
            <div className={`${getStatusColor(!!debugInfo.statistics?.error)}`}>
              <strong>Estadísticas:</strong> {debugInfo.statistics?.error ? '❌ Error' : '✅ Funcionando'}
            </div>
            <div className={`${getStatusColor(!!debugInfo.comments?.error)}`}>
              <strong>Comentarios:</strong> {debugInfo.comments?.error ? '❌ Error' : '✅ Funcionando'}
            </div>
            {user && debugInfo.userProfile?.data?.user_type === 'agent' && (
              <div className={`${getStatusColor(!!debugInfo.testPropertyInsert?.error)}`}>
                <strong>Publicación:</strong> {debugInfo.testPropertyInsert?.error ? '❌ Error' : '✅ Funcionando'}
              </div>
            )}
            <div className={`${getStatusColor(!!debugInfo.testImageUpload?.error)}`}>
              <strong>Subida imágenes:</strong> {debugInfo.testImageUpload?.error ? '❌ Error' : '✅ Funcionando'}
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold mb-2 text-yellow-800">Recomendaciones:</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            {debugInfo.allProperties?.error && (
              <div>• Aplicar migración para arreglar políticas de propiedades</div>
            )}
            {debugInfo.storageBuckets?.error && (
              <div>• Verificar configuración de storage buckets</div>
            )}
            {debugInfo.statistics?.error && (
              <div>• Aplicar migración para arreglar sistema de estadísticas</div>
            )}
            {debugInfo.comments?.error && (
              <div>• Aplicar migración para arreglar sistema de comentarios</div>
            )}
            {user && debugInfo.userProfile?.data?.user_type === 'agent' && debugInfo.testPropertyInsert?.error && (
              <div>• Verificar permisos de agentes para publicar propiedades</div>
            )}
            {debugInfo.testImageUpload?.error && (
              <div>• Verificar permisos de storage para subida de imágenes</div>
            )}
            {!debugInfo.allProperties?.error && !debugInfo.storageBuckets?.error && 
             !debugInfo.statistics?.error && !debugInfo.comments?.error &&
             (!user || !debugInfo.testPropertyInsert?.error) && !debugInfo.testImageUpload?.error && (
              <div>• ✅ Todos los sistemas funcionando correctamente</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
