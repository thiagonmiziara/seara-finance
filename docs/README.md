# Documentação — Saas Finanças

Este diretório centraliza **toda alteração relevante** que fizermos no produto, de modo que qualquer pessoa entrando no projeto consiga reconstruir as decisões tomadas.

## Estrutura

```
docs/
├── README.md             ← este arquivo
├── CHANGELOG.md          ← log cronológico de alterações
├── architecture/         ← visão geral do sistema, diagramas, schema
├── changes/              ← uma entrada por mudança relevante (feature, refactor, fix de impacto)
├── decisions/            ← Architecture Decision Records (ADRs)
├── legal/                ← termos, privacidade, cookies, opt-in WhatsApp, exclusão de conta (versionados)
└── security/             ← threat model, runbook de incidente, políticas de segurança
```

## Como registrar uma alteração

Toda mudança que afete arquitetura, fluxo de usuário, schema, integrações externas ou stack precisa de um arquivo em `docs/changes/`.

Padrão de nome: `YYYY-MM-DD-slug-curto.md` (ex.: `2026-05-04-clone-and-setup.md`).

Use o template em [`changes/_template.md`](changes/_template.md).

Após criar o arquivo, adicione uma linha no [`CHANGELOG.md`](CHANGELOG.md).

## Como registrar uma decisão arquitetural

Decisões com trade-offs (escolha de tecnologia, mudança de stack, padrão obrigatório no time) viram um ADR em `docs/decisions/`.

Padrão de nome: `NNNN-slug.md` numerado sequencialmente (ex.: `0001-firebase-auth-supabase-data.md`).

Use o template em [`decisions/_template.md`](decisions/_template.md).

## Squad

O squad multidisciplinar que trabalha neste produto está em [`../squads/saas-financas/`](../squads/saas-financas/) e é orquestrado via opensquad. Oito especialistas:

- **Felipe Finanças** 💰 — domínio financeiro brasileiro (cartão, fatura, parcelamento, dívida).
- **Fred Frontend** 🖼️ — React, TypeScript, Tailwind, shadcn/ui, TanStack Query.
- **Bruno Backend** 🛠️ — Supabase, Postgres, RLS, Edge Functions Deno, migrations.
- **Evelyn Evolution** 📲 — integração Evolution API (WhatsApp).
- **Sara Security** 🛡️ — cybersecurity, AppSec, LGPD-ops, hardening.
- **Lia Legal** ⚖️ — termos, privacidade, opt-in, conformidade LGPD/CDC/Marco Civil.
- **Marina Marketing** 📈 — estratégia de aquisição e funil.
- **Caio Copy** ✍️ — copy de landing, e-mail, WhatsApp e microcopy.
