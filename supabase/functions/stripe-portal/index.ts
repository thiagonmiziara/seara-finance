// stripe-portal
//
// Returns a Stripe Customer Portal session URL so the user can manage their
// subscription (update card, cancel, switch plan, see invoices).
//
// Body: { returnUrl?: string }

import { corsHeaders } from '../_shared/cors.ts';
import {
  bearerToken,
  verifyFirebaseIdToken,
} from '../_shared/firebase-jwt.ts';
import { getStripe, getServiceClient } from '../_shared/stripe.ts';

const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:5173';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const token = bearerToken(req);
  if (!token) {
    return new Response('Missing bearer token', { status: 401 });
  }

  let claims;
  try {
    claims = await verifyFirebaseIdToken(token);
  } catch (err) {
    console.error('[stripe-portal] invalid token', err);
    return new Response('Invalid token', { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    returnUrl?: string;
  };

  const admin = getServiceClient();
  const { data: userRow, error } = await admin
    .from('users')
    .select('stripe_customer_id')
    .eq('firebase_uid', claims.uid)
    .maybeSingle();

  if (error) {
    console.error('[stripe-portal] user lookup failed', error);
    return new Response('User lookup failed', { status: 500 });
  }
  if (!userRow?.stripe_customer_id) {
    return new Response('No Stripe customer for user', { status: 404 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: userRow.stripe_customer_id,
    return_url: body.returnUrl ?? `${APP_URL}/billing`,
    locale: 'pt-BR',
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
