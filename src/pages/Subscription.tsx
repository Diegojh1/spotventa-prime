import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { CheckoutModal } from '@/components/subscription/CheckoutModal';
import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionPlan } from '@/types/subscription';

interface SubscriptionProps {
  user?: any;
}

export function Subscription({ user }: SubscriptionProps) {
  const navigate = useNavigate();
  const { subscriptionStatus, loading } = useSubscription(user?.id);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    if (plan.price_monthly === 0) {
      // Free plan - activate immediately
      handleFreePlanActivation(plan);
    } else {
      // Paid plan - show checkout
      setShowCheckout(true);
    }
  };

  const handleFreePlanActivation = async (plan: SubscriptionPlan) => {
    // Here you would activate the free plan
    console.log('Activating free plan:', plan.name);
    // Navigate back or show success message
    navigate('/profile');
  };

  const handleCheckoutSuccess = () => {
    // Handle successful payment
    console.log('Payment successful for plan:', selectedPlan?.name);
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              ← Volver
            </Button>
            
            <div className="flex items-center gap-2">
              <img src="/LogoSolo.png" alt="SpotVenta" className="h-8 w-8" />
              <span className="text-xl font-bold">SpotVenta</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Elige tu Plan de
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Marketing Inmobiliario
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automatiza la promoción de tus propiedades y consigue más clientes 
            con nuestros planes diseñados específicamente para el mercado español.
          </p>
        </div>

                {/* Subscription Plans */}
        <div>
          <SubscriptionPlans
            userId={user?.id}
            onPlanSelect={handlePlanSelect}
            className="mb-16"
          />
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        plan={selectedPlan}
        billingCycle={billingCycle}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}


