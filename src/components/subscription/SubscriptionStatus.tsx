import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Users, 
  BarChart3, 
  Share2, 
  TrendingUp,
  Euro,
  AlertCircle
} from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { useNavigate } from 'react-router-dom';

interface SubscriptionStatusProps {
  userId?: string;
  className?: string;
}

export function SubscriptionStatus({ userId, className = '' }: SubscriptionStatusProps) {
  const { subscriptionStatus, loading } = useSubscription(userId);
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { 
    hasActiveSubscription, 
    currentPlan, 
    subscription, 
    canPublishProperty,
    canViewAnalytics,
    canUseMarketing,
    hasPriorityListing,
    freePropertiesRemaining,
    limits
  } = subscriptionStatus;

  const getStatusIcon = () => {
    if (hasActiveSubscription) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusText = () => {
    if (hasActiveSubscription) {
      return 'Plan Activo';
    }
    return 'Plan Gratuito';
  };

  const getStatusColor = () => {
    if (hasActiveSubscription) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Estado de Suscripción
          </CardTitle>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Plan actual */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-semibold">
              {currentPlan?.name || 'Plan Básico'}
            </h4>
            <p className="text-sm text-gray-600">
              {currentPlan?.description || 'Plan gratuito con 2 propiedades'}
            </p>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">
              {currentPlan?.price_monthly === 0 ? 'Gratis' : `€${currentPlan?.price_monthly}`}
            </div>
            <div className="text-sm text-gray-500">/mes</div>
          </div>
        </div>

        {/* Fecha de renovación */}
        {subscription && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Renovación: {formatDate(subscription.current_period_end)}</span>
          </div>
        )}

        {/* Límites de propiedades */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Propiedades publicadas</span>
          </div>
          <div className="text-right">
            <div className="font-bold">
              {limits?.total_properties_published || 0}
              {currentPlan?.max_properties === -1 ? '+' : `/${currentPlan?.max_properties || 2}`}
            </div>
            <div className="text-xs text-gray-500">
              {freePropertiesRemaining > 0 ? `${freePropertiesRemaining} gratis restantes` : 'Límite alcanzado'}
            </div>
          </div>
        </div>

        {/* Características del plan */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Características incluidas:</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className={`flex items-center gap-2 text-sm ${canPublishProperty ? 'text-green-600' : 'text-gray-400'}`}>
              {canPublishProperty ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>Publicar propiedades</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${canViewAnalytics ? 'text-green-600' : 'text-gray-400'}`}>
              {canViewAnalytics ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>Estadísticas avanzadas</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${canUseMarketing ? 'text-green-600' : 'text-gray-400'}`}>
              {canUseMarketing ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>Marketing automático</span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${hasPriorityListing ? 'text-green-600' : 'text-gray-400'}`}>
              {hasPriorityListing ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <span>Listado prioritario</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/subscription')}
            className="flex-1"
          >
            <Euro className="h-4 w-4 mr-1" />
            Cambiar Plan
          </Button>
          {hasActiveSubscription && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/billing')}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Facturación
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
