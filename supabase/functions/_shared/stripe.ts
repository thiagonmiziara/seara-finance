// Stripe helpers shared by stripe-checkout / stripe-webhook / stripe-portal.
//
// We use the official Stripe SDK via esm.sh (pinned). Stripe's Node SDK works
// in Deno when given the Web Crypto provider for signature verification.

import Stripe from 'https://esm.sh/stripe@17.4.0?target=deno';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export function getStripe(): Stripe {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(key, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export interface PriceTable {
  pro_month: string;
  pro_year: string;
}

export function getPriceTable(): PriceTable {
  const pro_month = Deno.env.get('STRIPE_PRICE_PRO_MONTH') ?? '';
  const pro_year = Deno.env.get('STRIPE_PRICE_PRO_YEAR') ?? '';
  return { pro_month, pro_year };
}

export type PlanId = 'pro_month' | 'pro_year';

export function planFromPriceId(
  priceId: string | null | undefined,
  table: PriceTable,
): { plan: 'pro' | 'free'; interval: 'month' | 'year' | null } {
  if (!priceId) return { plan: 'free', interval: null };
  if (priceId === table.pro_month) return { plan: 'pro', interval: 'month' };
  if (priceId === table.pro_year) return { plan: 'pro', interval: 'year' };
  return { plan: 'free', interval: null };
}

export function isoOrNull(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}
