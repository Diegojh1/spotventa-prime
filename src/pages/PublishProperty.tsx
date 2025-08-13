import { User } from '@supabase/supabase-js';
import { PropertyForm } from '@/components/property/PropertyForm';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Users, 
  Zap, 
  TrendingUp, 
  BarChart3,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PublishPropertyProps {
  user: User | null;
}

export function PublishProperty({ user }: PublishPropertyProps) {
  const navigate = useNavigate();
  const { subscriptionStatus, loading } = useSubscription(user?.id);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso denegado</h1>
          <p className="text-muted-foreground">
            Debes iniciar sesión para publicar propiedades.
          </p>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    navigate('/profile');
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando tu plan...</p>
        </div>
      </div>
    );
  }

  // Check if user can publish properties
  if (!subscriptionStatus.canPublishProperty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                <Crown className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Límite de Publicaciones Alcanzado
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Has alcanzado el límite de propiedades gratuitas. 
                Actualiza tu plan para publicar más propiedades y acceder a marketing automático.
              </p>
            </div>

            {/* Current Status */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Tu Estado Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {subscriptionStatus.freePropertiesRemaining}
                    </div>
                    <div className="text-sm text-gray-600">Propiedades Gratuitas Restantes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {subscriptionStatus.limits?.total_properties_published || 0}
                    </div>
                    <div className="text-sm text-gray-600">Propiedades Publicadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {subscriptionStatus.hasActiveSubscription ? 'Sí' : 'No'}
                    </div>
                    <div className="text-sm text-gray-600">Plan Activo</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <TrendingUp className="h-5 w-5" />
                    Plan Profesional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span className="text-lg font-semibold">€19.99/mes</span>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        <span>Propiedades ilimitadas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        <span>Marketing automático</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-green-500" />
                        <span>Estadísticas avanzadas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>Listado prioritario</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-700">
                    <Crown className="h-5 w-5" />
                    Plan Premium
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                      <span className="text-lg font-semibold">€39.99/mes</span>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        <span>Todo del plan Profesional</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        <span>API personalizada</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-green-500" />
                        <span>Integración con CRM</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span>Soporte 24/7</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/subscription')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
              >
                <Crown className="h-5 w-5 mr-2" />
                Ver Planes y Precios
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                30 días de garantía • Cancelar en cualquier momento
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PropertyForm 
        user={user} 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
