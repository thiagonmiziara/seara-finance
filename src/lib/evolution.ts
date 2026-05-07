// Frontend wrapper around the Edge Function "send-whatsapp".
//
// This module never talks to Evolution API directly — it only enqueues
// notifications via the Edge Function, which itself owns the API key.

import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

export type WhatsAppTemplate =
  | 'welcome_optin'
  | 'bill_reminder'
  | 'daily_spend_alert'
  | 'weekly_summary'
  | 'monthly_summary';

interface QueueOpts {
  scheduledAt?: Date;
}

export async function queueWhatsApp(
  template: WhatsAppTemplate,
  variables: Record<string, string | number | undefined>,
  opts: QueueOpts = {},
): Promise<{ id: string }> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('Sessão expirada — entre novamente.');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      template_key: template,
      variables,
      scheduled_at: opts.scheduledAt?.toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status} ao enviar WhatsApp`);
  }
  return (await res.json()) as { id: string };
}

export interface QueuedNotification {
  id: string;
  template_key: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  scheduled_at: string;
  sent_at: string | null;
  attempts: number;
  last_error: string | null;
}

export async function listMyNotifications(limit = 20): Promise<QueuedNotification[]> {
  const { data, error } = await supabase
    .from('notifications_queue')
    .select(
      'id, template_key, status, scheduled_at, sent_at, attempts, last_error',
    )
    .order('scheduled_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as QueuedNotification[];
}
