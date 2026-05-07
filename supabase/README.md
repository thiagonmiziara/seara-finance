# Supabase — Saas Finanças

Tudo de banco e Edge Functions vive aqui.

## Estrutura

```
supabase/
├── migrations/              ← SQL versionado (rodar em ordem)
│   ├── 0001_init.sql
│   └── 0002_seed_account.sql
├── functions/
│   ├── _shared/             ← código reaproveitado entre Edge Functions
│   │   ├── cors.ts
│   │   ├── evolution.ts     ← cliente HTTP da Evolution API
│   │   ├── firebase-jwt.ts  ← validação de ID Token via JWKS
│   │   └── templates.ts     ← templates de mensagem WhatsApp
│   ├── firebase-user-sync/  ← upsert da linha em users após login
│   ├── send-whatsapp/       ← enfileira mensagem em notifications_queue
│   ├── notifications-worker/← cron: consome a fila e envia via Evolution
│   └── evolution-webhook/   ← recebe callbacks (status / SAIR)
└── README.md
```

## Setup local

```bash
# 1. Instale a CLI
npm i -g supabase

# 2. Login
supabase login

# 3. Linkar com seu projeto
supabase link --project-ref <seu-ref>

# 4. Aplicar migrations
supabase db push

# 5. Deploy Edge Functions
supabase functions deploy firebase-user-sync
supabase functions deploy send-whatsapp
supabase functions deploy notifications-worker
supabase functions deploy evolution-webhook

# 6. Configurar secrets (server-side, nunca expostos no front)
supabase secrets set \
  FIREBASE_PROJECT_ID=... \
  EVOLUTION_API_URL=... \
  EVOLUTION_API_KEY=... \
  EVOLUTION_INSTANCE=... \
  EVOLUTION_WEBHOOK_SECRET=...
```

## Configurar Third-Party Auth (Firebase) no Supabase

No painel Supabase → Authentication → Settings → "JWT Settings" / "Third-party
auth", adicione um provider Firebase apontando para:

- **JWKS URL:** `https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com`
- **Issuer:** `https://securetoken.google.com/<FIREBASE_PROJECT_ID>`
- **Audience:** `<FIREBASE_PROJECT_ID>`

Isso faz `auth.uid()` retornar o `sub` (firebase uid) dentro das policies RLS.

## Cron do worker

No SQL Editor do Supabase:

```sql
select cron.schedule(
  'notifications-worker-tick',
  '*/1 * * * *', -- a cada minuto
  $$
  select net.http_post(
    url := 'https://<projeto>.supabase.co/functions/v1/notifications-worker',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  )
  $$
);
```

## Webhook na Evolution API

```bash
curl -X POST "$EVOLUTION_API_URL/webhook/set/$EVOLUTION_INSTANCE" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<projeto>.supabase.co/functions/v1/evolution-webhook",
    "headers": { "x-webhook-secret": "<EVOLUTION_WEBHOOK_SECRET>" },
    "events": ["messages.upsert", "messages.update", "connection.update"]
  }'
```
