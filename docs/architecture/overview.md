# Arquitetura — visão geral

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui + TanStack Query |
| Auth | Firebase Authentication (e-mail/senha) |
| DB / API | Supabase (Postgres + Realtime + Edge Functions + Storage) |
| Notificações | Evolution API (WhatsApp) — chamada via Edge Function |
| Hospedagem | Vercel (frontend) + Supabase (managed) |

## Fluxo de auth

```
[React app]
   │ signInWithEmailAndPassword(email, password)
   ▼
[Firebase Auth]
   │ retorna ID Token (JWT)
   ▼
[Supabase Client]
   │ accessToken: () => firebase.currentUser.getIdToken()
   ▼
[Supabase Postgres + RLS]
   │ auth.uid() == firebase_uid (extraído do JWT)
   ▼
[Linhas autorizadas pelo RLS]
```

## Fluxo de dados (transação)

1. Componente chama `useFinance().addTransaction(data)`.
2. Hook chama `supabase.from('transactions').insert(...)`.
3. Supabase aplica RLS, grava, e dispara evento Realtime.
4. Outros clients conectados recebem e atualizam cache do TanStack Query.

## Fluxo de notificação WhatsApp

1. Trigger no Postgres (ou cron Edge Function) detecta condição (ex.: fatura D-3).
2. Insere em `notifications_queue` com `status='pending'`.
3. Worker (Edge Function agendada) lê pendências, chama Evolution API.
4. Evolution API entrega no WhatsApp e dispara webhook.
5. Edge Function `evolution-webhook` recebe e atualiza `status` para `sent` / `delivered`.

## Limites de segurança

- Frontend só conhece chaves públicas (`VITE_*`).
- Service Role Key e API Key da Evolution só vivem em Edge Functions / vars do Supabase.
- Toda tabela tem RLS; sem exceção.
- Webhook da Evolution valida assinatura via `EVOLUTION_WEBHOOK_SECRET`.
