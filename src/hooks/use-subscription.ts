import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  UserSubscriptionStatus, 
  SubscriptionPlan, 
  UserSubscription, 
  PropertyPublishingLimits 
} from '@/types/subscription';

export function useSubscription(userId?: string) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<UserSubscriptionStatus>({
    hasActiveSubscription: false,
    canPublishProperty: false,
    canViewAnalytics: false,
    canUseMarketing: false,
    hasPriorityListing: false,
    freePropertiesRemaining: 2
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadSubscriptionStatus();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadSubscriptionStatus = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Get active subscription with plan details
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      // Handle case where tables don't exist yet (migration not applied)
      if (subError && (subError.code === 'PGRST116' || subError.message.includes('relation "user_subscriptions" does not exist'))) {
        console.log('Subscription tables not found, using default status');
        setSubscriptionStatus({
          hasActiveSubscription: false,
          canPublishProperty: true, // Allow publishing until limits are enforced
          canViewAnalytics: false,
          canUseMarketing: false,
          hasPriorityListing: false,
          freePropertiesRemaining: 2
        });
        return;
      }

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      // Get publishing limits
      const { data: limits, error: limitsError } = await supabase
        .from('property_publishing_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Handle case where tables don't exist yet
      if (limitsError && (limitsError.code === 'PGRST116' || limitsError.message.includes('relation "property_publishing_limits" does not exist'))) {
        console.log('Publishing limits table not found, using default limits');
        const currentPlan = subscription?.plan as SubscriptionPlan;
        const hasActiveSubscription = !!subscription && subscription.status === 'active';
        const status: UserSubscriptionStatus = {
          hasActiveSubscription,
          canPublishProperty: true, // Allow publishing until limits are enforced
          canViewAnalytics: hasActiveSubscription && currentPlan?.includes_analytics,
          canUseMarketing: hasActiveSubscription && currentPlan?.includes_marketing,
          hasPriorityListing: hasActiveSubscription && currentPlan?.includes_priority_listing,
          freePropertiesRemaining: 2
        };
        setSubscriptionStatus(status);
        return;
      }

      if (limitsError && limitsError.code !== 'PGRST116') {
        throw limitsError;
      }

      // Calculate subscription status
      const currentPlan = subscription?.plan as SubscriptionPlan;
      const currentSubscription = subscription as UserSubscription;
      const publishingLimits = limits as PropertyPublishingLimits;

      const hasActiveSubscription = !!subscription && subscription.status === 'active';
      const freePropertiesRemaining = Math.max(0, 2 - (publishingLimits?.free_properties_published || 0));
      
      const canPublishProperty = hasActiveSubscription 
        ? (currentPlan?.max_properties === -1 || (publishingLimits?.total_properties_published || 0) < currentPlan.max_properties)
        : freePropertiesRemaining > 0;

      const status: UserSubscriptionStatus = {
        hasActiveSubscription,
        canPublishProperty,
        canViewAnalytics: hasActiveSubscription && currentPlan?.includes_analytics,
        canUseMarketing: hasActiveSubscription && currentPlan?.includes_marketing,
        hasPriorityListing: hasActiveSubscription && currentPlan?.includes_priority_listing,
        freePropertiesRemaining,
        currentPlan,
        subscription: currentSubscription,
        limits: publishingLimits
      };

      setSubscriptionStatus(status);
    } catch (err) {
      console.error('Error loading subscription status:', err);
      setError('Error loading subscription status');
    } finally {
      setLoading(false);
    }
  };

  const checkCanPublishProperty = async (): Promise<boolean> => {
    if (!userId) return false;

    // Refresh subscription status before checking
    await loadSubscriptionStatus();
    return subscriptionStatus.canPublishProperty;
  };

  const incrementPublishedProperties = async () => {
    if (!userId) return;

    try {
      const { data: existingLimits } = await supabase
        .from('property_publishing_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingLimits) {
        // Update existing record
        const { error } = await supabase
          .from('property_publishing_limits')
          .update({
            free_properties_published: existingLimits.free_properties_published + 1,
            total_properties_published: existingLimits.total_properties_published + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('property_publishing_limits')
          .insert({
            user_id: userId,
            free_properties_published: 1,
            total_properties_published: 1
          });

        if (error) throw error;
      }

      // Reload subscription status
      await loadSubscriptionStatus();
    } catch (err) {
      console.error('Error incrementing published properties:', err);
      throw err;
    }
  };

  const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading subscription plans:', err);
      throw err;
    }
  };

  return {
    subscriptionStatus,
    loading,
    error,
    checkCanPublishProperty,
    incrementPublishedProperties,
    getSubscriptionPlans,
    refresh: loadSubscriptionStatus
  };
}
