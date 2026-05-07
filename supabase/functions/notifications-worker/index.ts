// notifications-worker
//
// Cron-triggered Edge Function (recommended: every 1 minute via pg_cron or
// Supabase scheduled functions). Picks up to N pending rows from
// notifications_queue, renders the template, calls Evolution API, and updates
// the row status.
//
// Idempotency: only rows in status='pending' with scheduled_at <= now() are
// claimed. The function flips them to 'sending' before the network call so a
// concurrent run doesn't double-deliver.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { readEvolutionConfig, sendText } from '../_shared/evolution.ts';
import {
  renderTemplate,
  type TemplateKey,
} from '../_shared/templates.ts';

const BATCH = Number(Deno.env.get('NOTIFICATIONS_BATCH') ?? 25);
const MAX_ATTEMPTS = Number(Deno.env.get('NOTIFICATIONS_MAX_ATTEMPTS') ?? 3);

Deno.serve(async () => {
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const cfg = readEvolutionConfig();

  const { data: pending, error } = await admin
    .from('notifications_queue')
    .select('id, template_key, payload, phone_e164, attempts, user_id')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(BATCH);

  if (error) {
    console.error('[worker] fetch pending failed', error);
    return new Response(error.message, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const row of pending ?? []) {
    // claim the row
    const { error: claimErr } = await admin
      .from('notifications_queue')
      .update({ status: 'sending', attempts: row.attempts + 1 })
      .eq('id', row.id)
      .eq('status', 'pending');
    if (claimErr) continue; // someone else took it

    try {
      const text = renderTemplate(
        row.template_key as TemplateKey,
        (row.payload ?? {}) as Record<string, string | number | undefined>,
      );
      const { messageId } = await sendText(cfg, row.phone_e164, text);

      await admin
        .from('notifications_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          evolution_message_id: messageId ?? null,
          last_error: null,
        })
        .eq('id', row.id);
      sent++;
    } catch (err: any) {
      const message = err?.message ?? String(err);
      const isFinal = row.attempts + 1 >= MAX_ATTEMPTS;
      await admin
        .from('notifications_queue')
        .update({
          status: isFinal ? 'failed' : 'pending',
          last_error: message.slice(0, 500),
          // re-schedule with simple backoff (1m, 5m, 30m)
          scheduled_at: isFinal
            ? null
            : new Date(
                Date.now() +
                  [60_000, 5 * 60_000, 30 * 60_000][row.attempts] ?? 60_000,
              ).toISOString(),
        })
        .eq('id', row.id);
      failed++;
      console.error('[worker] send failed', row.id, message);
    }
  }

  return new Response(JSON.stringify({ sent, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
