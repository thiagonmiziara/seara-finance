# Setup inicial — clone do seara-finance + squad opensquad

- **Data:** 2026-05-04
- **Autor:** equipe
- **Tipo:** chore + infra
- **Impacto:** alto (ponto zero do projeto)

## Contexto

Iniciar o SaaS de finanças partindo do projeto público `thiagonmiziara/seara-finance`, montar o squad multidisciplinar via opensquad e definir uma estrutura de documentação que registre todas as alterações dali em diante.

## O que mudou

- Repositório `seara-finance` clonado em [`../`](../) (raiz `saas-financas/`).
- Estrutura opensquad criada em [`../_opensquad/`](../_opensquad/) e [`../squads/saas-financas/`](../squads/saas-financas/).
- 4 agentes definidos:
  - [`squads/saas-financas/agents/financas.custom.md`](../../squads/saas-financas/agents/financas.custom.md) — Felipe Finanças.
  - [`squads/saas-financas/agents/evolution.custom.md`](../../squads/saas-financas/agents/evolution.custom.md) — Evelyn Evolution.
  - [`squads/saas-financas/agents/marketing.custom.md`](../../squads/saas-financas/agents/marketing.custom.md) — Marina Marketing.
  - [`squads/saas-financas/agents/copywriter.custom.md`](../../squads/saas-financas/agents/copywriter.custom.md) — Caio Copy.
- Briefs em [`squads/saas-financas/pipeline/data/`](../../squads/saas-financas/pipeline/data/): domínio, Evolution API e marketing.
- Pipeline padrão em [`squads/saas-financas/pipeline/pipeline.yaml`](../../squads/saas-financas/pipeline/pipeline.yaml).
- Pasta `docs/` criada com este `README`, `CHANGELOG`, e templates de changes/decisions.

## Como testar

```bash
cd /Users/thiagonunesmiziara/Desktop/saas-financas
ls _opensquad/ squads/saas-financas/agents/ docs/
yarn install   # ou npm install — dependências do projeto base
```

Rodar o squad (próximos passos): `/opensquad run saas-financas` no Claude Code com a raiz do projeto aberta.

## Pendências / próximos passos

1. Trocar Google OAuth por Firebase e-mail/senha — ver [`2026-05-04-migration-plan.md`](2026-05-04-migration-plan.md).
2. Substituir Firestore por Supabase — ver mesmo plano.
3. Implementar camada `src/lib/supabase.ts`.
4. Implementar Edge Function da Evolution API.

## Referências

- Repo original: https://github.com/thiagonmiziara/seara-finance
- ADR [0001](../decisions/0001-firebase-auth-supabase-data.md)
