/**
 * 📊 BILLING DASHBOARD COMPONENT
 * 
 * Componente principal para mostrar información de facturación del usuario.
 * Implementa un enfoque híbrido: visualización custom + gestión via Stripe Portal.
 * 
 * @author SpotVenta Team
 * @version 1.0.0
 * 
 * CARACTERÍSTICAS:
 * ✅ Muestra plan actual y próxima renovación
 * ✅ Información del método de pago
 * ✅ Historial de facturas con descarga
 * ✅ Botón para gestionar via Stripe Portal
 * ✅ Estados de carga y error
 * ✅ Responsive design
 * 
 * SEGURIDAD:
 * ✅ Solo muestra datos públicos/seguros
 * ✅ No maneja datos sensibles de tarjetas
 * ✅ Gestión crítica delegada a Stripe
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  ExternalLink, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// 📝 INTERFACES Y TIPOS
// ============================================================================

/**
 * Plan actual del usuario
 */
interface CurrentPlan {
  subscriptionId: string;
  name: string;
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  billingCycle: 'month' | 'year';
  amount: number;
  currency: string;
  cancelAtPeriodEnd: boolean;
}

/**
 * Método de pago del usuario
 */
interface PaymentMethod {
  id: string;
  type: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

/**
 * Factura individual
 */
interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  description: string;
  invoiceUrl: string;
  downloadUrl: string;
}

/**
 * Datos completos del dashboard
 */
interface BillingData {
  currentPlan: CurrentPlan | null;
  paymentMethod: PaymentMethod | null;
  invoices: Invoice[];
  hasStripeCustomer: boolean;
  customerId?: string;
}

/**
 * Props del componente principal
 */
interface BillingDashboardProps {
  userId: string;
  className?: string;
}

// ============================================================================
// 🎨 COMPONENTE PRINCIPAL
// ============================================================================

export function BillingDashboard({ userId, className = '' }: BillingDashboardProps) {
  // 🔄 Estados del componente
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  
  const { toast } = useToast();

  // 📡 Cargar datos de facturación
  useEffect(() => {
    loadBillingData();
  }, [userId]);

  /**
   * 📊 Cargar datos de facturación desde API
   */
  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/billing/dashboard/${userId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de facturación');
      }

      const data = await response.json();
      setBillingData(data);

    } catch (err) {
      console.error('Error cargando datos de billing:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de facturación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🎛️ Abrir Stripe Customer Portal
   */
  const openStripePortal = async () => {
    try {
      setOpeningPortal(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/billing/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Error al abrir portal de facturación');
      }

      const { url } = await response.json();
      window.location.href = url;

    } catch (err) {
      console.error('Error abriendo portal:', err);
      toast({
        title: "Error",
        description: "No se pudo abrir el portal de facturación",
        variant: "destructive"
      });
    } finally {
      setOpeningPortal(false);
    }
  };

  /**
   * 💳 Formatear información de tarjeta
   */
  const formatPaymentMethod = (pm: PaymentMethod) => {
    const brandNames: Record<string, string> = {
      'visa': 'Visa',
      'mastercard': 'Mastercard',
      'amex': 'American Express',
      'discover': 'Discover',
    };

    return {
      name: brandNames[pm.brand] || pm.brand.toUpperCase(),
      last4: `••••${pm.last4}`,
      expiry: `${pm.expMonth.toString().padStart(2, '0')}/${pm.expYear}`
    };
  };

  /**
   * 📅 Formatear fecha legible
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  /**
   * 💰 Formatear precio
   */
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  /**
   * 🎨 Obtener color del estado
   */
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'paid': 'bg-green-100 text-green-800',
      'past_due': 'bg-yellow-100 text-yellow-800',
      'canceled': 'bg-red-100 text-red-800',
      'open': 'bg-blue-100 text-blue-800',
      'incomplete': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // 🔄 Estados de carga
  if (loading) {
    return <BillingDashboardSkeleton />;
  }

  if (error) {
    return <BillingErrorState error={error} onRetry={loadBillingData} />;
  }

  if (!billingData?.hasStripeCustomer) {
    return <NoSubscriptionState />;
  }

  const { currentPlan, paymentMethod, invoices } = billingData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 📊 PLAN ACTUAL */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Plan Actual
              </CardTitle>
              <CardDescription>
                Tu suscripción activa y próxima renovación
              </CardDescription>
            </div>
            <Button 
              onClick={openStripePortal}
              disabled={openingPortal}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {openingPortal ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Abriendo...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Gestionar Plan
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentPlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{currentPlan.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {currentPlan.billingCycle === 'month' ? 'Mensual' : 'Anual'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(currentPlan.status)}>
                    {currentPlan.status === 'active' ? 'Activo' : currentPlan.status}
                  </Badge>
                  <p className="text-2xl font-bold mt-1">
                    {formatAmount(currentPlan.amount, currentPlan.currency)}
                    <span className="text-sm font-normal text-gray-600">
                      /{currentPlan.billingCycle === 'month' ? 'mes' : 'año'}
                    </span>
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  {currentPlan.cancelAtPeriodEnd 
                    ? `Se cancelará el ${formatDate(currentPlan.currentPeriodEnd)}`
                    : `Tu suscripción se renovará automáticamente el ${formatDate(currentPlan.currentPeriodEnd)}`
                  }
                </span>
              </div>
              
              {currentPlan.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Tu suscripción está programada para cancelarse
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No hay plan activo</p>
          )}
        </CardContent>
      </Card>

      {/* 💳 MÉTODO DE PAGO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Método de Pago
          </CardTitle>
          <CardDescription>
            Tarjeta utilizada para los pagos automáticos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethod ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">
                    {formatPaymentMethod(paymentMethod).name} {formatPaymentMethod(paymentMethod).last4}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expira {formatPaymentMethod(paymentMethod).expiry}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={openStripePortal}>
                <Settings className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-600">No hay método de pago configurado</p>
              <Button variant="outline" size="sm" onClick={openStripePortal}>
                <CreditCard className="h-4 w-4 mr-2" />
                Agregar Tarjeta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 📋 HISTORIAL DE FACTURAS */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas</CardTitle>
          <CardDescription>
            Historial de pagos y facturas descargables
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {invoice.status === 'paid' ? (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{formatDate(invoice.date)}</p>
                      <p className="text-sm text-gray-600">{invoice.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatAmount(invoice.amount, invoice.currency)}
                      </p>
                      <Badge size="sm" className={getStatusColor(invoice.status)}>
                        {invoice.status === 'paid' ? 'Pagado' : invoice.status}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-1">
                      {invoice.invoiceUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(invoice.invoiceUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.downloadUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(invoice.downloadUrl, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No hay facturas disponibles
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// 🎨 COMPONENTES AUXILIARES
// ============================================================================

/**
 * 💀 Skeleton loading state
 */
function BillingDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ❌ Error state component
 */
interface BillingErrorStateProps {
  error: string;
  onRetry: () => void;
}

function BillingErrorState({ error, onRetry }: BillingErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error al cargar facturación</h3>
        <p className="text-gray-600 text-center mb-4">{error}</p>
        <Button onClick={onRetry} variant="outline">
          Intentar de nuevo
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * 📭 No subscription state
 */
function NoSubscriptionState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay suscripciones activas</h3>
        <p className="text-gray-600 text-center mb-4">
          Aún no tienes ninguna suscripción. Explora nuestros planes para empezar.
        </p>
        <Button onClick={() => window.location.href = '/subscription'}>
          Ver Planes
        </Button>
      </CardContent>
    </Card>
  );
}

export default BillingDashboard;
