# Plano de migração — Firestore → Supabase + Google OAuth → Firebase e-mail/senha

- **Data:** 2026-05-04
- **Autor:** equipe
- **Tipo:** infra + refactor
- **Impacto:** alto

## Contexto

O `seara-finance` clonado usa Google OAuth + Firestore. Precisamos chegar em Firebase e-mail/senha + Supabase, conforme [ADR 0001](../decisions/0001-firebase-auth-supabase-data.md), sem quebrar o app durante o caminho.

## Estado atual (mapeado)

- [`src/lib/firebase.ts`](../../src/lib/firebase.ts) — exporta `auth`, `db` (Firestore) e `googleProvider`.
- [`src/hooks/useAuth.tsx`](../../src/hooks/useAuth.tsx) — login via `signInWithPopup(googleProvider)` e sync de perfil em `users/{uid}` no Firestore.
- [`src/hooks/useFinance.ts`](../../src/hooks/useFinance.ts), `useCards.ts`, `useDebts.ts`, `useCategories.tsx`, `useRecurringBills.ts`, etc. — todos lêem/gravam direto no Firestore via `collection(db, 'users', uid, 'accounts', accountType, …)`.
- [`src/App.tsx`](../../src/App.tsx) — tela de login mostra apenas botão Google.

## Etapas da migração

### 1. Auth — Google → e-mail/senha (Firebase ainda)

1. Habilitar **Email/Password** em Firebase Authentication; desabilitar Google.
2. Em [`src/lib/firebase.ts`](../../src/lib/firebase.ts), remover `GoogleAuthProvider` e exportar apenas `auth`.
3. Em [`src/hooks/useAuth.tsx`](../../src/hooks/useAuth.tsx), trocar `signInWithPopup` por:
   - `signInWithEmailAndPassword(auth, email, password)`
   - `createUserWithEmailAndPassword(auth, email, password)`
   - `sendPasswordResetEmail(auth, email)`
4. Atualizar API do hook: `login(email, password)`, `signup(email, password, name)`, `resetPassword(email)`.
5. Em [`src/App.tsx`](../../src/App.tsx) `LoginScreen`, trocar botão Google por formulário (e-mail, senha, "esqueci minha senha", "criar conta").
6. Caio Copy escreve labels, validações e mensagens de erro.

### 2. Dados — Firestore → Supabase

#### 2.1. Provisionamento

1. Criar projeto Supabase.
2. Habilitar **Third-Party Auth (Firebase)** apontando para o projeto Firebase.
3. Criar schema com migrations versionadas em `supabase/migrations/`.

#### 2.2. Schema (rascunho)

```sql
-- users espelho do Firebase
create table users (
  id uuid primary key,                -- = firebase uid (texto convertido pra uuid v5)
  firebase_uid text unique not null,
  email text not null,
  name text,
  avatar_url text,
  whatsapp_phone_e164 text,
  whatsapp_opt_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table users enable row level security;
create policy "user reads self" on users
  for select using (auth.uid()::text = firebase_uid);
create policy "user updates self" on users
  for update using (auth.uid()::text = firebase_uid);

-- demais tabelas: accounts, transactions, cards, debts, categories,
-- category_rules, recurring_bills, notifications_queue.
-- Todas com user_id uuid not null references users(id) e RLS análoga.
```

#### 2.3. Camada de dados

1. Adicionar `@supabase/supabase-js` em [`package.json`](../../package.json).
2. Criar `src/lib/supabase.ts` que inicializa o client com:
   - `accessToken: async () => (await auth.currentUser?.getIdToken()) ?? null` — passa ID Token do Firebase em todo request.
3. Reescrever cada hook (`useFinance`, `useCards`, `useDebts`, `useCategories`, `useRecurringBills`) para usar Supabase em vez de Firestore:
   - Reads viram `supabase.from('transactions').select(...).eq('user_id', userId)` + Realtime channels para sync.
   - Writes viram `insert/update/delete`.
   - Manter API pública dos hooks **idêntica** para minimizar mudança nos componentes.

#### 2.4. Migração de dados existentes

- Como ainda não temos usuários reais (ponto zero), **não há dados a migrar**. Se aparecerem usuários antes do switch, escrever um script Node que lê via Firebase Admin SDK e insere via Supabase Service Role.

### 3. Variáveis de ambiente

Adicionar a [`.env.example`](../../.env.example) (criar se não existir):

```
# Firebase (auth)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

# Supabase (dados)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Server-side (Edge Functions) — não prefixar com VITE_
SUPABASE_SERVICE_ROLE_KEY=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=
EVOLUTION_WEBHOOK_SECRET=
```

### 4. Evolution API (próxima fase)

- Edge Function `send-whatsapp` enfileira em `notifications_queue`.
- Edge Function `notifications-worker` consome a fila e chama Evolution API.
- Edge Function `evolution-webhook` recebe status (`sent`, `delivered`, `read`) e atualiza fila.
- Detalhes em [`squads/saas-financas/pipeline/data/evolution-api-brief.md`](../../squads/saas-financas/pipeline/data/evolution-api-brief.md).

## Estratégia de rollout

1. **Branch `feat/auth-email-password`** — etapa 1 isolada. Deploy em ambiente de staging.
2. **Branch `feat/supabase`** — etapa 2 isolada, sai depois que auth nova já estiver estável.
3. Etapa 4 (Evolution) entra como feature flag, opt-in pelo usuário.

## Pendências / próximos passos

- [ ] Criar projeto Firebase e ativar e-mail/senha.
- [ ] Criar projeto Supabase e ativar Third-Party Auth (Firebase).
- [ ] Implementar etapa 1 (auth).
- [ ] Implementar etapa 2 (Supabase) tabela por tabela.
- [ ] Implementar etapa 4 (Evolution API).
- [ ] Documentar cada uma dessas etapas em `docs/changes/`.

## Referências

- ADR [0001](../decisions/0001-firebase-auth-supabase-data.md)
- Briefs do squad em [`squads/saas-financas/pipeline/data/`](../../squads/saas-financas/pipeline/data/)
