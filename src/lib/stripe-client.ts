// Helpers de chamada para as Edge Functions de Stripe.
//
// As Edge Functions vivem em https://<projeto>.functions.supabase.co/<name>
// e exigem o ID Token do Firebase no header Authorization.

import { auth } from '@/lib/firebase';
import type { CheckoutPlan } from '@/lib/plans';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

function functionsBaseUrl(): string {
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL não definido');
  // Padrão Supabase: https://<ref>.supabase.co/functions/v1/<name>
  // (também funciona com supabase start local na porta 54321).
  return `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1`;
}

async function getToken(): Promise<string> {
  const u = auth.currentUser;
  if (!u) throw new Error('Usuário não autenticado');
  return await u.getIdToken();
}

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${functionsBaseUrl()}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${name} falhou (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function createCheckoutSession(
  plan: CheckoutPlan,
): Promise<{ url: string }> {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  return callFunction<{ url: string; id: string }>('stripe-checkout', {
    plan,
    successUrl: origin
      ? `${origin}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`
      : undefined,
    cancelUrl: origin ? `${origin}/billing?status=cancel` : undefined,
  });
}

export async function createPortalSession(): Promise<{ url: string }> {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  return callFunction<{ url: string }>('stripe-portal', {
    returnUrl: origin ? `${origin}/billing` : undefined,
  });
}
