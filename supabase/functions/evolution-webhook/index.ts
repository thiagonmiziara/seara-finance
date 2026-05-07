// evolution-webhook
//
// Endpoint that the Evolution API calls back when:
//  - a sent message changes status (delivered / read)
//  - the user replies (e.g. "SAIR" to opt out)
//  - the connection state changes
//
// Validates a shared secret and dedupes by event id.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const SECRET = Deno.env.get('EVOLUTION_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405 });

  if (SECRET) {
    const provided = req.headers.get('x-webhook-secret');
    if (provided !== SECRET) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const body = (await req.json().catch(() => null)) as
    | { event?: string; data?: any; instance?: string }
    | null;
  if (!body) return new Response('Bad request', { status: 400 });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const eventId =
    body.data?.key?.id ??
    body.data?.id ??
    `${body.event}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const { error: insertErr } = await admin
    .from('evolution_events')
    .insert({
      id: eventId,
      type: body.event ?? 'unknown',
      payload: body,
    })
    .select()
    .single();
  if (insertErr && !insertErr.message.includes('duplicate key')) {
    console.error('[webhook] dedup insert failed', insertErr);
    return new Response('Internal error', { status: 500 });
  }
  if (insertErr) {
    // duplicate event — already processed, ack quickly
    return new Response('ok-dup', { status: 200 });
  }

  // status updates: messages.update with key.id we know -> update queue row
  if (body.event === 'messages.update') {
    const messageId = body.data?.key?.id;
    const ackStatus = body.data?.update?.status as string | undefined;
    if (messageId && ackStatus) {
      await admin
        .from('notifications_queue')
        .update({ status: ackStatus === 'READ' ? 'sent' : 'sent' })
        .eq('evolution_message_id', messageId);
    }
  }

  // inbound message: handle SAIR (opt-out)
  if (body.event === 'messages.upsert') {
    const message = body.data?.message?.conversation as string | undefined;
    const fromMe = body.data?.key?.fromMe as boolean | undefined;
    const remoteJid = body.data?.key?.remoteJid as string | undefined; // "5511...@s.whatsapp.net"
    if (!fromMe && message && remoteJid) {
      const phone = remoteJid.replace(/@s\.whatsapp\.net$/, '');
      const trimmed = message.trim().toUpperCase();
      if (trimmed === 'SAIR' || trimmed === 'STOP') {
        await admin
          .from('users')
          .update({
            whatsapp_opt_in_at: null,
          })
          .eq('whatsapp_phone_e164', phone);
      }
    }
  }

  return new Response('ok', { status: 200 });
});
