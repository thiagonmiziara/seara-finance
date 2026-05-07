// stripe-webhook
//
// Receives Stripe events, validates the signature, and reconciles the
// `subscriptions` table with the customer's current state.
//
// Configure in Stripe Dashboard:
//   Endpoint URL: https://<project>.functions.supabase.co/stripe-webhook
//   Events: checkout.session.completed,
//           customer.subscription.created,
//           customer.subscription.updated,
//           customer.subscription.deleted,
//           invoice.paid,
//           invoice.payment_failed
//
// IMPORTANT: deploy with --no-verify-jwt because Stripe signs the request,
// not the user:
//   supabase functions deploy stripe-webhook --no-verify-jwt

import type Stripe from 'https://esm.sh/stripe@17.4.0?target=deno';
import {
  getStripe,
  getServiceClient,
  getPriceTable,
  planFromPriceId,
  isoOrNull,
} from '../_shared/stripe.ts';

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret missing', { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response('Missing signature', { status: 400 });

  const stripe = getStripe();
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      raw,
      sig,
      WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  const admin = getServiceClient();

  // Idempotency: skip if we've already processed this event
  const { data: existing } = await admin
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();
  if (existing) {
    return new Response('Already processed', { status: 200 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await reconcileSubscription(admin, sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await reconcileSubscription(admin, sub);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await reconcileSubscription(admin, sub);
        }
        break;
      }
      default:
        // ignore other events
        break;
    }

    await admin.from('stripe_events').insert({
      id: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[stripe-webhook] handler failed', err);
    return new Response('Handler error', { status: 500 });
  }
});

async function reconcileSubscription(
  admin: ReturnType<typeof getServiceClient>,
  sub: Stripe.Subscription,
) {
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  // Resolve app user via metadata first, then fall back to stripe_customer_id
  const metaUserId = sub.metadata?.app_user_id as string | undefined;
  let userId = metaUserId ?? null;

  if (!userId) {
    const { data } = await admin
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    userId = data?.id ?? null;
  }

  if (!userId) {
    console.warn(
      `[stripe-webhook] cannot map customer ${customerId} to a user; skipping`,
    );
    return;
  }

  const priceId = sub.items.data[0]?.price.id ?? null;
  const { plan, interval } = planFromPriceId(priceId, getPriceTable());

  // canceled/incomplete_expired → drop back to free
  const planFinal = sub.status === 'canceled' || sub.status === 'incomplete_expired'
    ? 'free'
    : plan;

  await admin
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        plan: planFinal,
        status: sub.status,
        interval,
        current_period_start: isoOrNull(sub.current_period_start),
        current_period_end: isoOrNull(sub.current_period_end),
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: isoOrNull(sub.canceled_at),
        trial_end: isoOrNull(sub.trial_end),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
}
