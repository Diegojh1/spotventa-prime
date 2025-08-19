require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase con service role key (para acceso completo desde backend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para webhooks (DEBE ir antes que bodyParser.json())
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Middleware general
app.use(cors());
app.use(bodyParser.json());

// Configuración de productos y precios de Stripe
const STRIPE_PRODUCTS = {
  BASIC: {
    id: null,
    name: 'Plan Básico',
    price_monthly: null,
    price_yearly: null,
  },
  PROFESSIONAL: {
    id: 'prod_SsEOqC4TlzYtTB',
    name: 'Plan Profesional',
    price_monthly: 'price_1RwTvnR4pzLDDxLyZH5s53on',
    price_yearly: null,
  },
  PREMIUM: {
    id: 'prod_SsESqiNH8jr2Zi',
    name: 'Plan Premium',
    price_monthly: 'price_1RwTzLR4pzLDDxLyoRLqsrrj',
    price_yearly: null,
  },
};

// Mapeo de planes a productos de Stripe
const PLAN_TO_STRIPE = {
  'basic': STRIPE_PRODUCTS.BASIC,
  'professional': STRIPE_PRODUCTS.PROFESSIONAL,
  'premium': STRIPE_PRODUCTS.PREMIUM,
};

// ✅ CREAR SUSCRIPCIÓN (Ruta principal para tu app)
app.post('/api/subscriptions/create', async (req, res) => {
  try {
    const { planId, userId } = req.body;

    console.log('🚀 Creando suscripción:', { planId, userId });

    // 🔒 VERIFICAR USUARIO REAL DESDE LA BASE DE DATOS
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      console.error('❌ Usuario no encontrado:', userError);
      return res.status(404).json({ error: 'Usuario no encontrado en la base de datos' });
    }

    // 🔒 USAR DATOS VERIFICADOS DE LA BASE DE DATOS
    const customerEmail = userProfile.email;
    const customerName = userProfile.full_name || 'Usuario';
    
    console.log('✅ Usuario verificado:', { 
      userId: userProfile.id, 
      email: customerEmail, 
      name: customerName 
    });

    // Validar plan
    if (planId === 'basic') {
      return res.status(400).json({ 
        error: 'El plan básico es gratuito y no requiere pago' 
      });
    }

    const stripeProduct = PLAN_TO_STRIPE[planId];
    if (!stripeProduct || !stripeProduct.price_monthly) {
      return res.status(400).json({ error: 'Plan no válido o no configurado' });
    }

    // Crear o obtener customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('👤 Customer existente:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: {
          userId: userId.toString(),
          planId: planId
        },
      });
      console.log('👤 Customer creado:', customer.id);
    }

    // Crear Checkout Session para suscripción
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription', // ← IMPORTANTE: subscription mode
      line_items: [{
        price: stripeProduct.price_monthly,
        quantity: 1,
      }],
      success_url: `${process.env.CORS_ORIGIN || 'http://localhost:8081'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CORS_ORIGIN || 'http://localhost:8081'}/cancel`,
      metadata: {
        userId: userId.toString(),
        planId: planId,
        customerEmail: customerEmail
      }
    });

    console.log('💳 Checkout session creado:', session.id);

    res.json({
      checkout_url: session.url,
      session_id: session.id,
      customer_id: customer.id
    });

  } catch (error) {
    console.error('❌ Error creando suscripción:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ OBTENER SUSCRIPCIONES DEL CUSTOMER
app.get('/api/subscriptions/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });

    res.json(subscriptions.data);
  } catch (error) {
    console.error('Error obteniendo suscripciones:', error);
    res.status(500).json({ error: 'Error obteniendo suscripciones' });
  }
});

// ✅ CANCELAR SUSCRIPCIÓN
app.post('/api/subscriptions/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    console.log('🗑️ Suscripción marcada para cancelar:', subscriptionId);

    res.json({ 
      success: true, 
      subscription,
      message: 'Suscripción se cancelará al final del período actual'
    });
  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    res.status(500).json({ error: 'Error cancelando suscripción' });
  }
});

// ✅ WEBHOOK MEJORADO PARA SUSCRIPCIONES
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log('📡 Webhook recibido:', event.type);

  } catch (err) {
    console.error('❌ Error verificando webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar eventos específicos de suscripciones
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('✅ CHECKOUT COMPLETADO');
      console.log('- Session ID:', session.id);
      console.log('- Customer:', session.customer);
      console.log('- Plan:', session.metadata?.planId);
      console.log('- Email:', session.metadata?.customerEmail);
      
      // TODO: Aquí actualizarías tu base de datos
      // - Marcar usuario como suscrito
      // - Activar funcionalidades del plan
      // - Enviar email de bienvenida
      break;

    case 'customer.subscription.created':
      const newSubscription = event.data.object;
      console.log('🎉 SUSCRIPCIÓN CREADA');
      console.log('- Subscription ID:', newSubscription.id);
      console.log('- Customer:', newSubscription.customer);
      console.log('- Status:', newSubscription.status);
      console.log('- Plan:', newSubscription.items.data[0].price.id);
      
      // TODO: Activar plan en tu base de datos
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('💰 PAGO EXITOSO');
      console.log('- Invoice ID:', invoice.id);
      console.log('- Customer:', invoice.customer);
      console.log('- Monto:', invoice.amount_paid / 100, invoice.currency.toUpperCase());
      console.log('- Es primera factura?', invoice.billing_reason === 'subscription_create');
      
      // TODO: Confirmar renovación del plan
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('❌ PAGO FALLÓ');
      console.log('- Invoice ID:', failedInvoice.id);
      console.log('- Customer:', failedInvoice.customer);
      console.log('- Monto:', failedInvoice.amount_due / 100, failedInvoice.currency.toUpperCase());
      
      // TODO: Suspender plan o enviar notificación
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      console.log('🔄 SUSCRIPCIÓN ACTUALIZADA');
      console.log('- Subscription ID:', updatedSubscription.id);
      console.log('- Status:', updatedSubscription.status);
      console.log('- Cancel at period end:', updatedSubscription.cancel_at_period_end);
      
      // TODO: Actualizar estado en base de datos
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('🗑️ SUSCRIPCIÓN CANCELADA');
      console.log('- Subscription ID:', deletedSubscription.id);
      console.log('- Customer:', deletedSubscription.customer);
      
      // TODO: Desactivar plan en base de datos
      break;

    default:
      console.log('🔍 Evento no manejado:', event.type);
  }

  res.json({ received: true });
});

// ✅ RUTA DE TESTING
app.get('/api/test/plans', (req, res) => {
  res.json({
    message: 'Configuración de planes',
    plans: STRIPE_PRODUCTS,
    stripe_configured: !!process.env.STRIPE_SECRET_KEY,
    webhook_configured: !!process.env.STRIPE_WEBHOOK_SECRET
  });
});

// ============================================================================
// 📊 BILLING DASHBOARD APIs
// ============================================================================

/**
 * 📊 API: Obtener información completa de facturación del usuario
 * 
 * @route GET /api/billing/dashboard/:userId
 * @description Retorna toda la información necesaria para el dashboard de facturación
 * @param {string} userId - ID del usuario en Supabase
 * @returns {Object} Información completa de billing
 * 
 * @example
 * GET /api/billing/dashboard/123e4567-e89b-12d3-a456-426614174000
 * 
 * Response:
 * {
 *   currentPlan: {
 *     name: "Plan Profesional",
 *     status: "active",
 *     currentPeriodEnd: "2025-08-23T00:00:00.000Z",
 *     billingCycle: "monthly",
 *     amount: 19.99,
 *     currency: "eur"
 *   },
 *   paymentMethod: {
 *     brand: "visa",
 *     last4: "4242",
 *     expMonth: 12,
 *     expYear: 2025
 *   },
 *   invoices: [
 *     {
 *       date: "2025-01-23T00:00:00.000Z",
 *       amount: 19.99,
 *       status: "paid",
 *       invoiceUrl: "https://invoice.stripe.com/..."
 *     }
 *   ]
 * }
 */
app.get('/api/billing/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔍 Obteniendo dashboard de billing para usuario:', userId);

    // 1️⃣ Verificar usuario en BD
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      console.error('❌ Usuario no encontrado:', userError);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // 2️⃣ Buscar customer en Stripe
    const customers = await stripe.customers.list({
      email: userProfile.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      console.log('ℹ️ Usuario sin suscripciones');
      return res.json({
        currentPlan: null,
        paymentMethod: null,
        invoices: [],
        hasStripeCustomer: false
      });
    }

    const customer = customers.data[0];
    console.log('✅ Customer encontrado:', customer.id);

    // 3️⃣ Obtener suscripciones activas
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1
    });

    let currentPlan = null;
    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const price = subscription.items.data[0].price;
      
      currentPlan = {
        subscriptionId: subscription.id,
        name: getPlanNameFromPriceId(price.id),
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        billingCycle: price.recurring.interval,
        amount: price.unit_amount / 100,
        currency: price.currency,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    }

    // 4️⃣ Obtener método de pago por defecto
    let paymentMethod = null;
    if (customer.invoice_settings?.default_payment_method) {
      const pm = await stripe.paymentMethods.retrieve(
        customer.invoice_settings.default_payment_method
      );
      
      paymentMethod = {
        id: pm.id,
        type: pm.type,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year
      };
    }

    // 5️⃣ Obtener últimas facturas
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 10
    });

    const invoiceHistory = invoices.data.map(invoice => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000).toISOString(),
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: invoice.status,
      description: invoice.description || `Suscripción ${invoice.lines.data[0]?.description}`,
      invoiceUrl: invoice.hosted_invoice_url,
      downloadUrl: invoice.invoice_pdf
    }));

    console.log('✅ Dashboard de billing obtenido exitosamente');

    res.json({
      currentPlan,
      paymentMethod,
      invoices: invoiceHistory,
      hasStripeCustomer: true,
      customerId: customer.id
    });

  } catch (error) {
    console.error('❌ Error obteniendo dashboard de billing:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

/**
 * 🎛️ API: Crear sesión del Customer Portal de Stripe
 * 
 * @route POST /api/billing/portal
 * @description Crea una sesión del Customer Portal para gestión de suscripciones
 * @param {string} userId - ID del usuario en el body
 * @returns {Object} URL del portal de Stripe
 * 
 * @example
 * POST /api/billing/portal
 * Body: { "userId": "123e4567-e89b-12d3-a456-426614174000" }
 * 
 * Response:
 * {
 *   "url": "https://billing.stripe.com/session/..."
 * }
 */
app.post('/api/billing/portal', async (req, res) => {
  try {
    const { userId } = req.body;

    console.log('🎛️ Creando sesión de Customer Portal para:', userId);

    // 1️⃣ Verificar usuario
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // 2️⃣ Buscar customer en Stripe
    const customers = await stripe.customers.list({
      email: userProfile.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ 
        error: 'No tienes suscripciones activas para gestionar' 
      });
    }

    // 3️⃣ Crear sesión del portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${process.env.CORS_ORIGIN}/profile?tab=billing`,
    });

    console.log('✅ Sesión de Customer Portal creada:', session.id);

    res.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('❌ Error creando sesión de portal:', error);
    res.status(500).json({ 
      error: 'Error creando sesión del portal',
      message: error.message 
    });
  }
});

// Función auxiliar para obtener precios (para referencia)
function getPlanPrice(planId, billingCycle = 'monthly') {
  const prices = {
    basic: { monthly: 0, yearly: 0 },
    professional: { monthly: 19.99, yearly: 199.99 },
    premium: { monthly: 39.99, yearly: 399.99 },
  };

  return prices[planId]?.[billingCycle] || 0;
}

/**
 * 🏷️ Función auxiliar: Obtener nombre del plan desde Price ID
 * 
 * @param {string} priceId - ID del precio de Stripe
 * @returns {string} Nombre legible del plan
 * 
 * @example
 * getPlanNameFromPriceId("price_1RwTvnR4pzLDDxLyZH5s53on") 
 * // Returns: "Plan Profesional"
 */
function getPlanNameFromPriceId(priceId) {
  // Mapear Price IDs a nombres de planes
  const priceToName = {
    [STRIPE_PRODUCTS.PROFESSIONAL.price_monthly]: 'Plan Profesional',
    [STRIPE_PRODUCTS.PREMIUM.price_monthly]: 'Plan Premium',
    // Agregar yearly prices cuando los implementes
  };
  
  return priceToName[priceId] || 'Plan Desconocido';
}

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    stripe_configured: !!process.env.STRIPE_SECRET_KEY,
    webhook_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
    supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log('🔧 Configuración:');
  console.log('  - Stripe:', !!process.env.STRIPE_SECRET_KEY ? '✅' : '❌');
  console.log('  - Webhook:', !!process.env.STRIPE_WEBHOOK_SECRET ? '✅' : '❌');
  console.log('  - Puerto:', PORT);
  console.log('📍 Rutas disponibles:');
  console.log('  - Health: http://localhost:' + PORT + '/health');
  console.log('  - Test Plans: http://localhost:' + PORT + '/api/test/plans');
  console.log('  - Create Subscription: POST /api/subscriptions/create');
  console.log('  - Webhook: POST /api/webhooks/stripe');
});