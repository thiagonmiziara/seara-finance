// stripe-checkout
//
// Creates a Stripe Checkout Session for the authenticated user and returns the
// hosted URL. The frontend redirects the browser to that URL.
//
// Body: { plan: 'pro_month' | 'pro_year', successUrl?: string, cancelUrl?: string }

import { corsHeaders } from '../_shared/cors.ts';
import {
  bearerToken,
  verifyFirebaseIdToken,
} from '../_shared/firebase-jwt.ts';
import {
  getStripe,
  getServiceClient,
  getPriceTable,
  type PlanId,
} from '../_shared/stripe.ts';

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
    console.error('[stripe-checkout] invalid token', err);
    return new Response('Invalid token', { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    plan?: PlanId;
    successUrl?: string;
    cancelUrl?: string;
  };

  const plan = body.plan;
  if (plan !== 'pro_month' && plan !== 'pro_year') {
    return new Response('Invalid plan', { status: 400 });
  }

  const prices = getPriceTable();
  const priceId = plan === 'pro_month' ? prices.pro_month : prices.pro_year;
  if (!priceId) {
    return new Response(`Price not configured for ${plan}`, { status: 500 });
  }

  const admin = getServiceClient();

  // Lookup or create app user
  const { data: userRow, error: userErr } = await admin
    .from('users')
    .select('id, email, stripe_customer_id')
    .eq('firebase_uid', claims.uid)
    .maybeSingle();

  if (userErr) {
    console.error('[stripe-checkout] user lookup failed', userErr);
    return new Response('User lookup failed', { status: 500 });
  }
  if (!userRow) {
    return new Response('User not synced yet', { status: 409 });
  }

  const stripe = getStripe();

  // Reuse or create Stripe customer
  let customerId = userRow.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userRow.email ?? claims.email ?? undefined,
      metadata: {
        app_user_id: userRow.id,
        firebase_uid: claims.uid,
      },
    });
    customerId = customer.id;
    await admin
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userRow.id);
  }

  const successUrl =
    body.successUrl ?? `${APP_URL}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    body.cancelUrl ?? `${APP_URL}/billing?status=cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    locale: 'pt-BR',
    subscription_data: {
      metadata: {
        app_user_id: userRow.id,
        firebase_uid: claims.uid,
      },
    },
    client_reference_id: userRow.id,
  });

  return new Response(JSON.stringify({ url: session.url, id: session.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
