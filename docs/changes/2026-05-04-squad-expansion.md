# Expansão do squad — frontend, backend, segurança e jurídico

- **Data:** 2026-05-04
- **Autor:** equipe
- **Tipo:** chore
- **Impacto:** médio (afeta como conduzimos releases — novo gate de security e legal)

## Contexto

O squad inicial tinha apenas 4 agentes (finanças, Evolution API, marketing, copywriter). Faltavam papéis essenciais para um SaaS que lida com dados financeiros pessoais: alguém entregando código de fato (frontend e backend), alguém vetando questões de segurança, e alguém cuidando de termos, privacidade e opt-in WhatsApp.

## O que mudou

- 4 novos agentes:
  - [`squads/saas-financas/agents/frontend.custom.md`](../../squads/saas-financas/agents/frontend.custom.md) — **Fred Frontend** 🖼️.
  - [`squads/saas-financas/agents/backend.custom.md`](../../squads/saas-financas/agents/backend.custom.md) — **Bruno Backend** 🛠️.
  - [`squads/saas-financas/agents/security.custom.md`](../../squads/saas-financas/agents/security.custom.md) — **Sara Security** 🛡️.
  - [`squads/saas-financas/agents/legal.custom.md`](../../squads/saas-financas/agents/legal.custom.md) — **Lia Legal** ⚖️.
- 4 novos briefs em [`squads/saas-financas/pipeline/data/`](../../squads/saas-financas/pipeline/data/): `frontend-brief.md`, `backend-brief.md`, `security-brief.md`, `legal-brief.md`.
- [`pipeline.yaml`](../../squads/saas-financas/pipeline/pipeline.yaml) atualizado com 4 novos steps (`backend-design`, `frontend-build`, `security-audit`, `legal-review`).
- [`squad.yaml`](../../squads/saas-financas/squad.yaml) lista os 8 agentes na ordem do fluxo natural (finanças → backend → frontend → evolution → security → legal → marketing → copy).
- Pastas novas em `docs/`: [`legal/`](../legal/) e [`security/`](../security/) reservadas para documentos versionados.

## Como o pipeline muda

- Toda mudança que toca dados ou novo canal **passa obrigatoriamente** pelo step `security-audit` antes do release.
- Mudanças que afetam tratamento de dados pessoais ou criam novo canal de comunicação acionam `legal-review` para atualizar termos/privacidade/opt-in com nova versão.

## Pendências / próximos passos

- [ ] Fred Frontend e Bruno Backend executarem etapa 1 do plano de migração (auth e-mail/senha).
- [ ] Sara Security publicar primeiro `docs/security/threat-model.md` e `docs/security/incident-runbook.md`.
- [ ] Lia Legal entregar `docs/legal/terms-v1.md`, `privacy-v1.md` e `whatsapp-optin-v1.md` em rascunho (com flag `needs_human_review`).

## Referências

- [Plano de migração](2026-05-04-migration-plan.md)
- [ADR 0001](../decisions/0001-firebase-auth-supabase-data.md)
