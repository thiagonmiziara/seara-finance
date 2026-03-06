## Context

O projeto possui diversos components e hooks sem testes unitários, o que dificulta a manutenção e aumenta o risco de bugs. O objetivo é garantir uma cobertura mínima de 90% para aumentar a confiabilidade e facilitar futuras evoluções.

## Goals / Non-Goals

**Goals:**

- Criar testes unitários para todos os components e hooks sem cobertura.
- Alcançar pelo menos 90% de coverage global.
- Cobrir casos de sucesso, falha e borda.

**Non-Goals:**

- Refatorar lógica de negócio dos components/hooks além do necessário para testabilidade.
- Cobrir código morto ou não utilizado.

## Decisions

- Utilizar Vitest e Testing Library para testes de components e hooks React.
- Priorizar cobertura de components/hook sem nenhum teste.
- Permitir pequenos ajustes para facilitar a testabilidade (ex: exportar funções auxiliares, injeção de dependências).

## Risks / Trade-offs

- [Risk] Cobertura alta pode levar a testes superficiais → Mitigação: Focar em cenários relevantes e casos de borda.
- [Risk] Ajustes para testabilidade podem introduzir regressões → Mitigação: Revisar cuidadosamente mudanças não relacionadas a teste.
