// Lightweight Evolution API client used by Edge Functions.
//
// The user-facing Edge Function `send-whatsapp` only enqueues into
// notifications_queue. The actual HTTP call to Evolution happens in the
// `notifications-worker` and is the only place where this client runs.

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
}

export function readEvolutionConfig(): EvolutionConfig {
  const baseUrl = Deno.env.get('EVOLUTION_API_URL');
  const apiKey = Deno.env.get('EVOLUTION_API_KEY');
  const instance = Deno.env.get('EVOLUTION_INSTANCE');
  if (!baseUrl || !apiKey || !instance) {
    throw new Error(
      'EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE precisam estar configurados',
    );
  }
  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey,
    instance,
  };
}

export async function sendText(
  cfg: EvolutionConfig,
  phoneE164: string,
  text: string,
): Promise<{ messageId?: string }> {
  const res = await fetch(
    `${cfg.baseUrl}/message/sendText/${encodeURIComponent(cfg.instance)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: cfg.apiKey,
      },
      body: JSON.stringify({
        number: phoneE164,
        text,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Evolution sendText failed (${res.status}): ${body}`);
  }

  const data = (await res.json().catch(() => ({}))) as {
    key?: { id?: string };
    messageId?: string;
  };
  return { messageId: data.key?.id ?? data.messageId };
}
