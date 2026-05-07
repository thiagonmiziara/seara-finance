// send-whatsapp
//
// Frontend (or an internal scheduled function) calls this to enqueue a
// WhatsApp message. It does NOT call Evolution API directly — it inserts a
// row in notifications_queue. The notifications-worker function reads the
// queue and performs the actual delivery.
//
// Body:
//   {
//     "template_key": "bill_reminder",
//     "variables": { "card_name": "Nubank", ... },
//     "scheduled_at": "2026-05-04T18:00:00Z"   // optional, default: now
//   }
//
// The phone number is read from public.users.whatsapp_phone_e164 — never
// trusted from the request body — and the user must have whatsapp_opt_in_at
// not null.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';
import {
  bearerToken,
  verifyFirebaseIdToken,
} from '../_shared/firebase-jwt.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405 });

  const token = bearerToken(req);
  if (!token) return new Response('Missing bearer token', { status: 401 });

  let claims;
  try {
    claims = await verifyFirebaseIdToken(token);
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    template_key?: string;
    variables?: Record<string, unknown>;
    scheduled_at?: string;
  };

  if (!body.template_key) {
    return new Response('template_key required', { status: 400 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: userRow, error: userErr } = await admin
    .from('users')
    .select('id, whatsapp_phone_e164, whatsapp_opt_in_at')
    .eq('firebase_uid', claims.uid)
    .maybeSingle();

  if (userErr || !userRow) {
    return new Response('User not found', { status: 404 });
  }
  if (!userRow.whatsapp_phone_e164 || !userRow.whatsapp_opt_in_at) {
    return new Response('User has not opted in for WhatsApp', { status: 412 });
  }

  const { error: insertErr, data: queued } = await admin
    .from('notifications_queue')
    .insert({
      user_id: userRow.id,
      template_key: body.template_key,
      payload: body.variables ?? {},
      phone_e164: userRow.whatsapp_phone_e164,
      scheduled_at: body.scheduled_at ?? new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertErr) {
    console.error('[send-whatsapp] insert failed', insertErr);
    return new Response(insertErr.message, { status: 500 });
  }

  return new Response(JSON.stringify({ id: queued.id }), {
    status: 202,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
