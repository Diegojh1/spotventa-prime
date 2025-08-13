import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_CONFIG, STRIPE_PRODUCTS } from '@/config/stripe';
import { supabase } from '@/integrations/supabase/client';

let stripePromise: Promise<Stripe | null>;

// Inicializar Stripe
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
};

// Tipos para los pagos
export interface CreatePaymentIntentRequest {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  userId: string;
  customerEmail: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  customerId?: string;
}

export interface SubscriptionResponse {
  subscriptionId: string;
  customerId: string;
  status: string;
  currentPeriodEnd: string;
}

// Crear intent de pago
export const createPaymentIntent = async (
  request: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> => {
  try {
    // En un entorno real, esto se haría en el backend
    // Por ahora, simularemos la respuesta
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Error creating payment intent');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Crear suscripción
export const createSubscription = async (
  planId: string,
  billingCycle: 'monthly' | 'yearly',
  userId: string,
  customerEmail: string
): Promise<SubscriptionResponse> => {
  try {
    // En un entorno real, esto se haría en el backend
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/subscriptions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        billingCycle,
        userId,
        customerEmail,
      }),
    });

    if (!response.ok) {
      throw new Error('Error creating subscription');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

// Cancelar suscripción
export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  try {
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/subscriptions/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
      throw new Error('Error canceling subscription');
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

// Obtener métodos de pago del usuario
export const getPaymentMethods = async (customerId: string) => {
  try {
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payments/methods/${customerId}`);
    
    if (!response.ok) {
      throw new Error('Error fetching payment methods');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

// Guardar método de pago
export const savePaymentMethod = async (
  customerId: string,
  paymentMethodId: string
) => {
  try {
    const response = await fetch(`${STRIPE_CONFIG.apiUrl}/api/payments/methods/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        paymentMethodId,
      }),
    });

    if (!response.ok) {
      throw new Error('Error saving payment method');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving payment method:', error);
    throw error;
  }
};

// Simulación para desarrollo (sin backend)
export const simulatePayment = async (
  planId: string,
  billingCycle: 'monthly' | 'yearly',
  userId: string
): Promise<SubscriptionResponse> => {
  // Simular delay de procesamiento
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generar IDs simulados
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const customerId = `cus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calcular fecha de fin de período
  const now = new Date();
  const currentPeriodEnd = new Date(now);
  if (billingCycle === 'monthly') {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  } else {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
  }

  return {
    subscriptionId,
    customerId,
    status: 'active',
    currentPeriodEnd: currentPeriodEnd.toISOString(),
  };
};
