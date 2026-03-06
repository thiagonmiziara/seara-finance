## Why

Atualmente, diversos components e hooks do projeto não possuem testes unitários, o que dificulta a manutenção, evolução e confiança no código. Com a ausência de testes, bugs podem passar despercebidos e refatorações se tornam arriscadas. A meta é garantir pelo menos 90% de cobertura de testes para aumentar a robustez e facilitar futuras mudanças.

## What Changes

- Criação de testes unitários para todos os components React que ainda não possuem testes.
- Criação de testes unitários para todos os hooks customizados que ainda não possuem testes.
- Garantia de cobertura mínima de 90% para components e hooks.
- Ajustes menores em components/hooks para facilitar testabilidade, se necessário (sem alterar requisitos funcionais).

## Capabilities

### New Capabilities

- `unit-test-coverage`: Cobertura mínima de 90% de testes unitários para components e hooks.

### Modified Capabilities

## Impact

- src/components/\* (todos os components sem teste)
- src/hooks/\* (todos os hooks sem teste)
- Dependências de testes (ex: vitest, testing-library/react)
- Possível ajuste em configurações de coverage
