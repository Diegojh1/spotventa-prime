-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    max_properties INTEGER NOT NULL DEFAULT 0,
    includes_marketing BOOLEAN NOT NULL DEFAULT false,
    includes_analytics BOOLEAN NOT NULL DEFAULT false,
    includes_priority_listing BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT NOT NULL,
    type TEXT NOT NULL,
    last4 TEXT,
    brand TEXT,
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create billing history table
CREATE TABLE IF NOT EXISTS public.billing_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property publishing limits table
CREATE TABLE IF NOT EXISTS public.property_publishing_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    free_properties_published INTEGER NOT NULL DEFAULT 0,
    total_properties_published INTEGER NOT NULL DEFAULT 0,
    last_free_property_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_monthly, price_yearly, features, max_properties, includes_marketing, includes_analytics, includes_priority_listing) VALUES
(
    'Básico',
    'Perfecto para empezar. 2 propiedades gratis + marketing básico',
    0.00,
    0.00,
    '["2 propiedades gratis", "Marketing básico en redes sociales", "Soporte por email"]',
    2,
    true,
    false,
    false
),
(
    'Profesional',
    'Para agentes inmobiliarios activos. Marketing avanzado incluido',
    19.99,
    199.99,
    '["Propiedades ilimitadas", "Marketing automático en Google Ads y Facebook", "Estadísticas detalladas", "Listado prioritario", "Soporte prioritario"]',
    -1,
    true,
    true,
    true
),
(
    'Premium',
    'Para agencias grandes. Todo incluido + API personalizada',
    39.99,
    399.99,
    '["Todo del plan Profesional", "API personalizada", "Integración con CRM", "Gestión de equipos", "Soporte 24/7"]',
    -1,
    true,
    true,
    true
);

-- Add RLS policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_publishing_limits ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies (readable by all authenticated users)
CREATE POLICY "subscription_plans_read_policy" ON public.subscription_plans
    FOR SELECT USING (auth.role() = 'authenticated');

-- User subscriptions policies
CREATE POLICY "user_subscriptions_read_policy" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_subscriptions_insert_policy" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_subscriptions_update_policy" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Payment methods policies
CREATE POLICY "payment_methods_read_policy" ON public.payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payment_methods_insert_policy" ON public.payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_methods_update_policy" ON public.payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "payment_methods_delete_policy" ON public.payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Billing history policies
CREATE POLICY "billing_history_read_policy" ON public.billing_history
    FOR SELECT USING (auth.uid() = user_id);

-- Property publishing limits policies
CREATE POLICY "property_publishing_limits_read_policy" ON public.property_publishing_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "property_publishing_limits_insert_policy" ON public.property_publishing_limits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "property_publishing_limits_update_policy" ON public.property_publishing_limits
    FOR UPDATE USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans for users';
COMMENT ON TABLE public.user_subscriptions IS 'Active user subscriptions';
COMMENT ON TABLE public.payment_methods IS 'User payment methods stored securely';
COMMENT ON TABLE public.billing_history IS 'Payment history for users';
COMMENT ON TABLE public.property_publishing_limits IS 'Track free property publishing limits';
