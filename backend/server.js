const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuración de productos y precios de Stripe
const STRIPE_PRODUCTS = {
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

// Mapeo de planes a productos de Stripe
const PLAN_TO_STRIPE = {
  'basic': STRIPE_PRODUCTS.BASIC,
  'professional': STRIPE_PRODUCTS.PROFESSIONAL,
  'premium': STRIPE_PRODUCTS.PREMIUM,
};

// Crear intent de pago
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const { planId, billingCycle, userId, customerEmail } = req.body;

    // Obtener el producto de Stripe correspondiente
    const stripeProduct = PLAN_TO_STRIPE[planId];
    if (!stripeProduct) {
      return res.status(400).json({ error: 'Plan no válido' });
    }

    // Obtener el precio según el ciclo de facturación
    const priceId = billingCycle === 'monthly' ? stripeProduct.price_monthly : stripeProduct.price_yearly;

    // Crear o obtener el cliente
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId: userId,
        },
      });
    }

    // Crear el intent de pago
    const paymentIntent = await stripe.paymentIntents.create({
      amount: getPlanPrice(planId, billingCycle) * 100, // Stripe usa centavos
      currency: 'eur',
      customer: customer.id,
      metadata: {
        planId: planId,
        billingCycle: billingCycle,
        userId: userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customer.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Error creating payment intent' });
  }
});

// Crear suscripción
app.post('/api/subscriptions/create', async (req, res) => {
  try {
    const { planId, billingCycle, userId, customerEmail } = req.body;

    // Obtener el producto de Stripe correspondiente
    const stripeProduct = PLAN_TO_STRIPE[planId];
    if (!stripeProduct) {
      return res.status(400).json({ error: 'Plan no válido' });
    }

    // Obtener el precio según el ciclo de facturación
    const priceId = billingCycle === 'monthly' ? stripeProduct.price_monthly : stripeProduct.price_yearly;

    // Crear o obtener el cliente
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId: userId,
        },
      });
    }

    // Crear la suscripción
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        planId: planId,
        userId: userId,
      },
    });

    res.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Error creating subscription' });
  }
});

// Cancelar suscripción
app.post('/api/subscriptions/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Error canceling subscription' });
  }
});

// Obtener métodos de pago
app.get('/api/payments/methods/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    res.json(paymentMethods.data);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Error fetching payment methods' });
  }
});

// Guardar método de pago
app.post('/api/payments/methods/save', async (req, res) => {
  try {
    const { customerId, paymentMethodId } = req.body;

    // Adjuntar el método de pago al cliente
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Establecer como método de pago por defecto
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving payment method:', error);
    res.status(500).json({ error: 'Error saving payment method' });
  }
});

// Webhook para eventos de Stripe
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar eventos
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('Payment succeeded for invoice:', invoice.id);
      // Aquí actualizarías la base de datos
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('Payment failed for invoice:', failedInvoice.id);
      // Aquí manejarías el pago fallido
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('Subscription updated:', subscription.id);
      // Aquí actualizarías la suscripción en la base de datos
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('Subscription deleted:', deletedSubscription.id);
      // Aquí cancelarías la suscripción en la base de datos
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Función auxiliar para obtener el precio del plan
function getPlanPrice(planId, billingCycle) {
  const prices = {
    basic: { monthly: 0, yearly: 0 },
    professional: { monthly: 19.99, yearly: 199.99 },
    premium: { monthly: 39.99, yearly: 399.99 },
  };

  return prices[planId]?.[billingCycle] || 0;
}

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
