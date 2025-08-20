import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  Check, 
  X,
  Euro,
  Calendar,
  Users,
  Zap,
  Loader2
} from 'lucide-react';
import { SubscriptionPlan } from '@/types/subscription';
import { getStripe, createSubscription } from '@/services/payment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan | null;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: () => void;
}

export function CheckoutModal({ 
  isOpen, 
  onClose, 
  plan, 
  billingCycle, 
  onSuccess 
}: CheckoutModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const getPrice = () => {
    if (!plan) return 0;
    return billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  };

  const getSavings = () => {
    if (!plan || billingCycle === 'monthly') return 0;
    const monthlyTotal = plan.price_monthly * 12;
    const yearlyPrice = plan.price_yearly;
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !user) return;

    setLoading(true);
    setError(null);

    try {
      // Crear suscripción real usando el backend de Stripe
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/subscriptions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id === 'prod_SsEOqC4TlzYtTB' ? 'professional' : 'premium',
          userId: user.id,
          customerEmail: user.email,
          customerName: user.full_name || 'Usuario'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar el pago');
      }

      const data = await response.json();
      
      // Redirigir a Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return; // No continuar con el resto del código local
      } else {
        throw new Error('No se recibió URL de checkout');
      }



      toast({
        title: "¡Pago exitoso!",
        description: `Tu suscripción ${plan.name} ha sido activada correctamente.`,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Payment error:', err);
      setError('Error procesando el pago. Por favor, inténtalo de nuevo.');
      toast({
        title: "Error en el pago",
        description: "Hubo un problema procesando tu pago. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiryDate(e.target.value));
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Completar Compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{plan.name}</h3>
                <Badge variant="secondary">
                  {billingCycle === 'monthly' ? 'Mensual' : 'Anual'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">€{getPrice()}</span>
                {getSavings() > 0 && (
                  <span className="text-green-600 text-sm">
                    Ahorras {getSavings()}%
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {plan.features.slice(0, 2).join(', ')}
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="cardholder">Nombre del titular</Label>
              <Input
                id="cardholder"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Como aparece en la tarjeta"
                required
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Número de tarjeta</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
                <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Fecha de expiración</Label>
                <Input
                  id="expiry"
                  value={expiryDate}
                  onChange={handleExpiryDateChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-600">
                  <X className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Pago seguro con encriptación SSL</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando pago...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Pagar €{getPrice()}
                </div>
              )}
            </Button>
          </form>

          {/* Trust Indicators */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Seguro
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Garantía 30 días
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Al completar la compra, aceptas nuestros términos y condiciones
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
