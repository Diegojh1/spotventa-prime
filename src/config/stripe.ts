// Configuración de Stripe
export const STRIPE_CONFIG = {
  // Clave pública de Stripe (segura para el frontend)
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
  
  // URL del backend para procesar pagos
  apiUrl: 'https://spotventa-prime-production.up.railway.app',
  
  // Configuración de moneda
  currency: 'eur',
  
  // Configuración de impuestos (IVA español 21%)
  taxRate: 0.21,
  
  // Configuración de webhooks
  webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || 'whsec_...',
};

// Productos de Stripe (IDs de productos en tu cuenta de Stripe)
export const STRIPE_PRODUCTS = {
  BASIC: {
    id: 'prod_basic_plan',
    name: 'Plan Básico',
    price_monthly: 'price_basic_monthly',
    price_yearly: 'price_basic_yearly',
  },
  PROFESSIONAL: {
    id: 'prod_professional_plan',
    name: 'Plan Profesional',
    price_monthly: 'price_professional_monthly',
    price_yearly: 'price_professional_yearly',
  },
  PREMIUM: {
    id: 'prod_premium_plan',
    name: 'Plan Premium',
    price_monthly: 'price_premium_monthly',
    price_yearly: 'price_premium_yearly',
  },
};

// Configuración de características por plan
export const PLAN_FEATURES = {
  BASIC: {
    max_properties: 2,
    includes_marketing: false,
    includes_analytics: false,
    includes_priority_listing: false,
  },
  PROFESSIONAL: {
    max_properties: -1, // Ilimitado
    includes_marketing: true,
    includes_analytics: true,
    includes_priority_listing: false,
  },
  PREMIUM: {
    max_properties: -1, // Ilimitado
    includes_marketing: true,
    includes_analytics: true,
    includes_priority_listing: true,
  },
};
