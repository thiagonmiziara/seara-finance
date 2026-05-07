// useSubscription
//
// Lê a linha de subscription do usuário corrente (criada por trigger no
// sign-up e mantida pelo webhook). Em modo "free/inactive" tudo bate certo:
// effectivePlan() devolve 'free' e os gates respondem como esperado.

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import {
  type Subscription,
  type Feature,
  FREE_SUBSCRIPTION,
  effectivePlan,
  hasFeature,
} from '@/lib/plans';

interface SubscriptionRow {
  plan: string;
  status: string;
  interval: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

function rowToSubscription(row: SubscriptionRow | null): Subscription {
  if (!row) return FREE_SUBSCRIPTION;
  return {
    plan: (row.plan as Subscription['plan']) ?? 'free',
    status: (row.status as Subscription['status']) ?? 'inactive',
    interval: (row.interval as Subscription['interval']) ?? null,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: !!row.cancel_at_period_end,
    trialEnd: row.trial_end,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
  };
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setSubscription(FREE_SUBSCRIPTION);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        'plan, status, interval, current_period_end, cancel_at_period_end, trial_end, stripe_customer_id, stripe_subscription_id',
      )
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('[useSubscription] load failed', error.message);
      setSubscription(FREE_SUBSCRIPTION);
    } else {
      setSubscription(rowToSubscription(data as SubscriptionRow | null));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await reload();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  return {
    subscription: subscription ?? FREE_SUBSCRIPTION,
    plan: effectivePlan(subscription),
    isPro: effectivePlan(subscription) === 'pro',
    can: (feature: Feature) => hasFeature(subscription, feature),
    loading,
    reload,
  };
}
