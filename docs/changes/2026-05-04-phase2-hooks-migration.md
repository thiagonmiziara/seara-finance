# Fase 2 — migração dos hooks restantes para Supabase

- **Data:** 2026-05-04
- **Autor:** equipe
- **Tipo:** refactor
- **Impacto:** alto (toda a camada de dados do front sai do Firestore)

## Contexto

Continuação da [Fase 1](2026-05-04-phase1-implementation.md). Restavam 7 hooks
ainda em Firestore que faziam o app inteiro depender da camada antiga. Esta
fase migra todos eles preservando a API pública (mesmas assinaturas, mesmos
shapes) — então as páginas, componentes e modais não precisaram mudar.

## O que mudou

### Hooks migrados (Firestore → Supabase)

- [`src/hooks/useCards.ts`](../../src/hooks/useCards.ts)
- [`src/hooks/useDebts.ts`](../../src/hooks/useDebts.ts)
- [`src/hooks/useCategories.tsx`](../../src/hooks/useCategories.tsx)
- [`src/hooks/useCategoryRules.ts`](../../src/hooks/useCategoryRules.ts)
- [`src/hooks/useRecurringBills.ts`](../../src/hooks/useRecurringBills.ts)
- [`src/hooks/useRecurringBillsSync.ts`](../../src/hooks/useRecurringBillsSync.ts)

Padrão usado em todos:

1. `useQuery` para o read (chave: `[recurso, user.id, accountId]`).
2. Subscrição via `supabase.channel(...).on('postgres_changes', ...)` filtrando por `account_id`, invalidando o cache em qualquer evento.
3. Mutations com optimistic update onde fazia sentido (delete, update simples).
4. Helpers `rowToX` / `formToRow` para a conversão snake_case ↔ camelCase, mantendo a interface pública dos hooks.

### Helpers / utilitários

- [`src/hooks/useMigration.ts`](../../src/hooks/useMigration.ts) virou no-op (era um adapter para mover dados entre layouts antigos do Firestore — sem propósito agora).
- [`src/hooks/useFinance.ts`](../../src/hooks/useFinance.ts) — `addTransfer` aceita `destinationAccountType` (string `'personal' | 'business'`) e resolve internamente para o `account_id` do Supabase, criando a conta se ainda não existir. Mantém compatibilidade com [`AddTransactionModal`](../../src/components/AddTransactionModal.tsx).

### Inicialização sem trava em testes

- [`src/lib/supabase.ts`](../../src/lib/supabase.ts) deixa de lançar erro no import quando faltam env vars (apenas loga em produção). Isso permite os testes mockarem o client sem precisar configurar env real.
- [`.env.test`](../../.env.test) novo arquivo com placeholders carregados pelo Vite quando `NODE_ENV=test`.
- [`src/test/setup.ts`](../../src/test/setup.ts) — polyfill simples de `localStorage` para contornar o bug do par jsdom 28 + vitest 4 (`--localstorage-file was provided without a valid path`).

### Tests atualizados

- [`src/hooks/useAuth.test.tsx`](../../src/hooks/useAuth.test.tsx) — agora cobre `login(email, password)`, `signup`, `resetPassword`.
- [`src/hooks/useAccount.test.tsx`](../../src/hooks/useAccount.test.tsx) — wrapper com `QueryClientProvider`; mocks de `useAuth` e `supabase`; chave de localStorage `sf:accountType`.
- [`src/hooks/useCategories.test.tsx`](../../src/hooks/useCategories.test.tsx) — mocks de Supabase (chain `from().select().eq().order()`) substituem os mocks do Firestore.
- [`src/components/CardsView.test.tsx`](../../src/components/CardsView.test.tsx) — removido import de `firebase/firestore`.

## Como verificar

```bash
yarn install
yarn tsc -b   # build limpa
yarn test     # 19/20 test files passam (a única falha é UI vs test no EditCardLimitModal — pré-existente, não relacionado à migração)
```

## Status atual

| Categoria | Estado |
|-----------|--------|
| TypeScript build | ✅ limpo |
| Imports `firebase/firestore` no `src/` | ✅ zero |
| `firebase/auth` | ✅ apenas e-mail/senha |
| Hooks rodando em Supabase | ✅ todos |
| Realtime sync | ✅ via Supabase channels |
| RLS habilitada nas tabelas | ✅ todas |
| Tests | ✅ 57/58 passing (1 pré-existente) |

## Pendências

- Configurar projeto real no Supabase + aplicar migrations + ativar Third-Party Auth (Firebase) — guia em [`supabase/README.md`](../../supabase/README.md).
- Lia Legal entrega rascunhos jurídicos.
- Caio Copy revisa os 5 templates de WhatsApp.
- Sara Security publica threat model + incident runbook.
- Configurar `pg_cron` chamando `notifications-worker`.

## Referências

- [Fase 1](2026-05-04-phase1-implementation.md)
- [Plano original](2026-05-04-migration-plan.md)
- [ADR 0001](../decisions/0001-firebase-auth-supabase-data.md)
