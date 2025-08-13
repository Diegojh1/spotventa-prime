export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_properties: number;
  includes_marketing: boolean;
  includes_analytics: boolean;
  includes_priority_listing: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  type: string;
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: string;
}

export interface BillingHistory {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  description?: string;
  created_at: string;
}

export interface PropertyPublishingLimits {
  id: string;
  user_id: string;
  free_properties_published: number;
  total_properties_published: number;
  last_free_property_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionStatus {
  hasActiveSubscription: boolean;
  canPublishProperty: boolean;
  canViewAnalytics: boolean;
  canUseMarketing: boolean;
  hasPriorityListing: boolean;
  freePropertiesRemaining: number;
  currentPlan?: SubscriptionPlan;
  subscription?: UserSubscription;
  limits?: PropertyPublishingLimits;
}

export interface CreateSubscriptionRequest {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethodId?: string;
}

export interface UpdateSubscriptionRequest {
  planId?: string;
  billingCycle?: 'monthly' | 'yearly';
  cancelAtPeriodEnd?: boolean;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

export interface MarketingAutomationConfig {
  google_ads_enabled: boolean;
  facebook_ads_enabled: boolean;
  instagram_ads_enabled: boolean;
  budget_daily: number;
  target_audience: string[];
  ad_copy_templates: string[];
}
