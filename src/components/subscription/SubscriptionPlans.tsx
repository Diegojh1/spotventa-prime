import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Star, 
  Zap, 
  TrendingUp, 
  Crown,
  Euro,
  Calendar,
  Users,
  BarChart3,
  Share2,
  Shield,
  Clock
} from 'lucide-react';
import { SubscriptionPlan } from '@/types/subscription';

interface SubscriptionPlansProps {
  userId?: string;
  onPlanSelect?: (plan: SubscriptionPlan) => void;
  className?: string;
}

export function SubscriptionPlans({ userId, onPlanSelect, className = '' }: SubscriptionPlansProps) {
  // Default plans for development
  const defaultPlans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Básico',
      description: 'Perfecto para empezar',
      price_monthly: 0,
      price_yearly: 0,
      features: ['2 propiedades gratis', 'Acceso básico'],
      max_properties: 2,
      includes_marketing: false,
      includes_analytics: false,
      includes_priority_listing: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'professional',
      name: 'Profesional',
      description: 'Para agentes inmobiliarios',
      price_monthly: 19.99,
      price_yearly: 199.99,
      features: ['Propiedades ilimitadas', 'Marketing automático', 'Estadísticas básicas'],
      max_properties: -1,
      includes_marketing: true,
      includes_analytics: true,
      includes_priority_listing: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Para agencias grandes',
      price_monthly: 39.99,
      price_yearly: 399.99,
      features: ['Todo del Profesional', 'Listado prioritario', 'Estadísticas avanzadas', 'Soporte prioritario'],
      max_properties: -1,
      includes_marketing: true,
      includes_analytics: true,
      includes_priority_listing: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'básico':
        return <Star className="h-6 w-6" />;
      case 'profesional':
        return <TrendingUp className="h-6 w-6" />;
      case 'premium':
        return <Crown className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'básico':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'profesional':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'premium':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className={className}>
      <h2 className="text-3xl font-bold text-center mb-8">
        Planes de Suscripción
      </h2>
      
      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {defaultPlans.map((plan, index) => (
          <Card key={plan.id} className="relative h-full transition-all duration-300 hover:shadow-lg">
            {plan.name === 'Profesional' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Más Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${getPlanColor(plan.name)}`}>
                {getPlanIcon(plan.name)}
              </div>
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <p className="text-gray-600 text-sm">{plan.description}</p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Price */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold">
                    {plan.price_monthly === 0 ? 'Gratis' : `€${plan.price_monthly}`}
                  </span>
                  {plan.price_monthly > 0 && (
                    <span className="text-gray-500">/mes</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Property Limits */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Propiedades</span>
                </div>
                <span className="text-lg font-bold">
                  {plan.max_properties === -1 ? 'Ilimitadas' : `${plan.max_properties} incluidas`}
                </span>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => onPlanSelect?.(plan)}
                className={`w-full ${
                  plan.name === 'Profesional' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : plan.name === 'Premium'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {plan.price_monthly === 0 ? 'Empezar Gratis' : 'Elegir Plan'}
              </Button>

              {/* Money Back Guarantee */}
              {plan.price_monthly > 0 && (
                <div className="text-center text-xs text-gray-500">
                  <Shield className="h-3 w-3 inline mr-1" />
                  30 días de garantía
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
