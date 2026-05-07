# Stripe — Setup de cobrança

Esta integração entrega: **assinatura Pro mensal/anual em BRL**, **Stripe Checkout hospedado**, **Customer Portal** para auto-gestão e **webhook** que sincroniza a tabela `subscriptions`.

## Arquitetura

```
Front (React)
  ├─ /billing → cria Checkout Session (Edge Function: stripe-checkout)
  └─ /billing → abre Customer Portal (Edge Function: stripe-portal)

Stripe
  └─ webhook → Edge Function: stripe-webhook
        → upsert public.subscriptions (service role)

Postgres
  ├─ public.users.stripe_customer_id  (cache)
  ├─ public.subscriptions             (1 linha por user, snapshot)
  └─ public.stripe_events             (idempotência do webhook)
```

Estado do plano mora em `public.subscriptions`. O front consulta via RLS (somente leitura do dono) através do hook `useSubscription`.

## Setup passo a passo

### 1. Stripe Dashboard

1. Crie um **Product** "Finzap Pro".
2. Adicione 2 **Prices** (recurring): mensal R$ 19,90 e anual R$ 199,00 — ambos em **BRL**.
3. Anote os **Price IDs** (`price_...`).
4. Em **Developers → API keys**, copie a **Secret key** (`sk_test_...` em dev).
5. Em **Developers → Webhooks**, adicione um endpoint:
   - URL: `https://<projeto>.functions.supabase.co/stripe-webhook`
   - Events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Após criar, copie o **Signing secret** (`whsec_...`).
6. Em **Settings → Billing → Customer portal**, ative o portal (cancelar, atualizar cartão, ver invoices).

### 2. Migrations

```bash
supabase db push   # aplica supabase/migrations/0005_subscriptions.sql
```

A migration:
- adiciona `users.stripe_customer_id`,
- cria `public.subscriptions` (RLS: select-only do dono),
- cria `public.stripe_events` (idempotência),
- adiciona trigger que cria a linha `free/inactive` em todo novo usuário,
- faz backfill para usuários já existentes.

### 3. Secrets das Edge Functions

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  STRIPE_PRICE_PRO_MONTH=price_xxx \
  STRIPE_PRICE_PRO_YEAR=price_xxx \
  APP_URL=https://app.finzap.com.br
```

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `FIREBASE_PROJECT_ID` já devem estar setados (usados por outras functions).

### 4. Deploy das Edge Functions

```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-portal
# Webhook: Stripe assina a request — sem JWT do usuário
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 5. Frontend

`.env` (front):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

A página `/billing` já está plugada no `AppShell` e no `Sidebar` (item "Assinatura").

## Como verificar

1. `supabase functions logs stripe-webhook --tail` (em outro terminal).
2. No app, acesse `/billing` → "Assinar Pro" → use cartão de teste `4242 4242 4242 4242` (qualquer data futura/CVC).
3. Após o redirect com `?status=success`, a página tenta recarregar a `subscription` por ~10s.
4. No Stripe CLI: `stripe trigger customer.subscription.updated` para testar webhook em dev local (usar `stripe listen --forward-to https://<projeto>.functions.supabase.co/stripe-webhook`).

## Gating de features

Em qualquer componente:

```tsx
import { useSubscription } from '@/hooks/useSubscription';

const { isPro, can } = useSubscription();

if (!can('whatsapp_inbound')) {
  return <UpgradePrompt feature='WhatsApp' />;
}
```

Os feature flags vivem em [src/lib/plans.ts](../src/lib/plans.ts) — adicione novos lá.

## Cancelamento e downgrade

- Cancelamento sai pelo **Customer Portal** (botão "Gerenciar assinatura"). Stripe marca `cancel_at_period_end=true`; o webhook atualiza a linha; ao final do período, `customer.subscription.deleted` chega → `plan='free'`.
- Mudança de mensal ↔ anual também pelo Portal (proração padrão da Stripe).

## Troubleshooting

| Sintoma | Causa provável |
|---|---|
| 401 ao chamar `stripe-checkout` | Token Firebase expirou; recarregar a página. |
| 409 "User not synced yet" | Primeira ida ao `/billing` antes do upsert do user. Recarregar. |
| Webhook devolve 400 "Invalid signature" | `STRIPE_WEBHOOK_SECRET` errado ou função foi deployada sem `--no-verify-jwt`. |
| Plano não atualiza após pagamento | Conferir logs do webhook; ver se `app_user_id` está nos metadata da subscription (sai do checkout). |
