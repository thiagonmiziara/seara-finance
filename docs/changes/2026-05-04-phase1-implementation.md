# Fase 1 — auth e-mail/senha + Supabase + WhatsApp scaffold

- **Data:** 2026-05-04
- **Autor:** equipe
- **Tipo:** feature + refactor + infra
- **Impacto:** alto (toca auth, dados e introduz integração externa)

## Contexto

Primeira fase concreta do plano de migração definido em
[`2026-05-04-migration-plan.md`](2026-05-04-migration-plan.md). Substitui Google
OAuth por e-mail/senha, introduz Supabase como camada de dados (com bridge JWT
para o Firebase Auth) e cria o esqueleto da integração com a Evolution API
para envio de WhatsApp.

## O que mudou

### Frontend

- [`src/lib/firebase.ts`](../../src/lib/firebase.ts) — removeu `GoogleAuthProvider` e Firestore. Mantém só `auth`.
- [`src/hooks/useAuth.tsx`](../../src/hooks/useAuth.tsx) — agora expõe `login(email, password)`, `signup(email, password, name)`, `resetPassword(email)`, `logout()` e o estado `authError` mapeado em português.
- [`src/components/auth/LoginScreen.tsx`](../../src/components/auth/LoginScreen.tsx) — nova tela com 3 modos: login / cadastro / esqueci senha.
- [`src/App.tsx`](../../src/App.tsx) — usa o novo `LoginScreen`.
- [`src/lib/supabase.ts`](../../src/lib/supabase.ts) — client Supabase com `accessToken: () => firebase.currentUser.getIdToken()` (Third-Party Auth).
- [`src/lib/users.ts`](../../src/lib/users.ts) — upsert da linha em `users` ao logar.
- [`src/lib/evolution.ts`](../../src/lib/evolution.ts) — wrapper `queueWhatsApp(template, vars)` que chama o Edge Function `send-whatsapp`.
- [`src/hooks/useAccount.tsx`](../../src/hooks/useAccount.tsx) — agora resolve `accountId` (uuid no Supabase) e cria a conta sob demanda.
- [`src/hooks/useUserProfile.ts`](../../src/hooks/useUserProfile.ts) — ler/gravar campos `whatsapp_*`, `terms_*`, `onboarding_*` na linha em `users`.
- [`src/hooks/useFinance.ts`](../../src/hooks/useFinance.ts) — totalmente reescrito sobre Supabase (Realtime + queries + parcelamento de cartão).
- [`src/components/WhatsAppOnboardingModal.tsx`](../../src/components/WhatsAppOnboardingModal.tsx) — agora grava no Supabase + dispara `welcome_optin`.
- [`src/components/WhatsAppSettings.tsx`](../../src/components/WhatsAppSettings.tsx) — novo componente plugado na `TopBar` para conectar/desconectar.

### Backend (Supabase)

- [`supabase/migrations/0001_init.sql`](../../supabase/migrations/0001_init.sql) — cria 9 tabelas (`users`, `accounts`, `categories`, `cards`, `transactions`, `debts`, `recurring_bills`, `category_rules`, `notifications_queue`, `evolution_events`) com **RLS habilitada em todas** e função utilitária `current_app_user_id()`.
- [`supabase/migrations/0002_seed_account.sql`](../../supabase/migrations/0002_seed_account.sql) — trigger que cria a conta `personal` automaticamente após inserir um usuário.
- Edge Functions (Deno):
  - [`firebase-user-sync`](../../supabase/functions/firebase-user-sync/index.ts) — verifica ID Token, upsert em `users`, devolve uuid.
  - [`send-whatsapp`](../../supabase/functions/send-whatsapp/index.ts) — valida JWT, valida opt-in, enfileira em `notifications_queue`.
  - [`notifications-worker`](../../supabase/functions/notifications-worker/index.ts) — cron a cada 1 min; lê fila, renderiza template, chama Evolution API, retry com backoff (1m / 5m / 30m).
  - [`evolution-webhook`](../../supabase/functions/evolution-webhook/index.ts) — dedupe por `event_id`, atualiza status na fila, processa `SAIR` (opt-out automático).
- Helpers compartilhados em [`supabase/functions/_shared/`](../../supabase/functions/_shared/) (`cors.ts`, `firebase-jwt.ts`, `evolution.ts`, `templates.ts`).

### Configuração

- [`package.json`](../../package.json) — nome do app `saas-financas` v0.1.0; adicionou dependência `@supabase/supabase-js@^2.45.4`.
- [`.env.example`](../../.env.example) — variáveis Firebase + Supabase (`VITE_*`) e variáveis server-side (Evolution + service role) sem prefixo.
- [`supabase/README.md`](../../supabase/README.md) — instruções para aplicar migrations, fazer deploy, configurar Third-Party Auth, agendar o worker e registrar o webhook na Evolution.

## Como testar

```bash
# 1. Instalar deps
yarn install   # ou npm install

# 2. Preencher .env.local com as chaves do Firebase + Supabase

# 3. Rodar migrations no Supabase
supabase db push

# 4. Configurar Third-Party Auth no Supabase apontando para o Firebase
#    (ver supabase/README.md)

# 5. Deploy das Edge Functions
supabase functions deploy firebase-user-sync send-whatsapp notifications-worker evolution-webhook
supabase secrets set FIREBASE_PROJECT_ID=... EVOLUTION_API_URL=... EVOLUTION_API_KEY=... EVOLUTION_INSTANCE=... EVOLUTION_WEBHOOK_SECRET=...

# 6. Subir front
yarn dev

# 7. Smoke test
#    - criar conta com e-mail/senha
#    - verificar linha criada em public.users + public.accounts (personal)
#    - cadastrar transação no Dashboard → confirma INSERT em public.transactions
#    - clicar "Conectar WhatsApp" na TopBar → preencher número → recebe welcome
#    - mandar "SAIR" no WhatsApp → conferir whatsapp_opt_in_at virando null
```

## Pendências (Fase 2 e 3)

- [ ] Migrar hooks restantes para Supabase: `useCards`, `useDebts`, `useCategories`, `useRecurringBills`, `useCategoryRules`, `useMigration`, `useRecurringBillsSync`. Padrão definido em `useFinance` e `useAccount`.
- [ ] Lia Legal entregar versão 1 dos termos/privacidade/opt-in em [`docs/legal/`](../legal/).
- [ ] Sara Security publicar [`docs/security/threat-model.md`](../security/) e [`docs/security/incident-runbook.md`](../security/).
- [ ] Caio Copy revisar templates em [`supabase/functions/_shared/templates.ts`](../../supabase/functions/_shared/templates.ts).
- [ ] Configurar `pg_cron` para chamar `notifications-worker` a cada minuto.
- [ ] Implementar Edge Function `monthly-recurring-runner` (gera transações de `recurring_bills` no dia 1).

## Riscos conhecidos

- **Hooks restantes ainda em Firestore.** As páginas de cartão, dívidas, categorias e contas fixas vão quebrar até a Fase 2 sair. Caminho está documentado e o padrão já existe.
- **JWKS do Firebase** muda; `jose` faz cache, mas se o projeto mudar ou rotacionar chaves, o cache de 5 min do JOSE pode atrasar. Aceitável.
- **Sem Admin SDK do Firebase** — Edge Functions verificam JWT via JWKS público; isso é suficiente para identificar o usuário, mas operações administrativas (desabilitar conta etc.) precisariam de Admin SDK no futuro.

## Referências

- [ADR 0001](../decisions/0001-firebase-auth-supabase-data.md)
- [Plano de migração](2026-05-04-migration-plan.md)
- [Brief Evolution API](../../squads/saas-financas/pipeline/data/evolution-api-brief.md)
