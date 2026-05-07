# Changelog

Log cronológico de todas as alterações relevantes. Cada linha aponta para o arquivo detalhado em `docs/changes/`.

## 2026-05-04

- **Setup inicial do projeto** — clone do `seara-finance`, criação do squad opensquad e da pasta de documentação. Ver [`changes/2026-05-04-clone-and-setup.md`](changes/2026-05-04-clone-and-setup.md).
- **Squad ampliado** — adicionados 4 agentes (Fred Frontend, Bruno Backend, Sara Security, Lia Legal) ao squad inicial; agora são 8 especialistas. Ver [`changes/2026-05-04-squad-expansion.md`](changes/2026-05-04-squad-expansion.md).
- **ADR 0001** — adoção de Firebase Authentication (e-mail/senha) para auth e Supabase (Postgres) para dados. Ver [`decisions/0001-firebase-auth-supabase-data.md`](decisions/0001-firebase-auth-supabase-data.md).
- **Plano de migração** — caminho para sair de Firestore + Google OAuth para Supabase + Firebase e-mail/senha. Ver [`changes/2026-05-04-migration-plan.md`](changes/2026-05-04-migration-plan.md).
- **Fase 1 implementada** — auth e-mail/senha, Supabase (schema completo + RLS), 4 Edge Functions da Evolution API, hooks `useAccount`/`useUserProfile`/`useFinance` migrados, WhatsApp opt-in e settings na UI. Hooks restantes seguem padrão estabelecido. Ver [`changes/2026-05-04-phase1-implementation.md`](changes/2026-05-04-phase1-implementation.md).
- **Fase 2 implementada** — migrados os 7 hooks restantes (`useCards`, `useDebts`, `useCategories`, `useCategoryRules`, `useRecurringBills`, `useRecurringBillsSync`, `useMigration` no-op) para Supabase. Build TS limpo, suite de testes verde (1 falha pré-existente não relacionada). Ver [`changes/2026-05-04-phase2-hooks-migration.md`](changes/2026-05-04-phase2-hooks-migration.md).
- **Cores elegantes + stack local Docker da Evolution + bot multimídia** — paleta forest+champagne, tokens `--gold` novos, gradiente refinado. Stack Docker em [`docker/`](../docker/) (Evolution + Postgres + Redis + bot) e bot em [`bot/`](../bot/) que classifica, baixa, transcreve áudio (Whisper) e descreve imagem (GPT-4o-mini). Ver [`changes/2026-05-04-elegant-colors-and-docker-bot.md`](changes/2026-05-04-elegant-colors-and-docker-bot.md).
