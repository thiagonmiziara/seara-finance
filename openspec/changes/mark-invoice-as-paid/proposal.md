## Why

A lista de "Previsão de Fatura" no CardsView acumula todos os meses pendentes indefinidamente. Sem a opção de marcar uma fatura como paga, a lista fica extensa e não reflete a realidade financeira do usuário.

## What Changes

- Adicionar botão "Pagar fatura" em cada linha de mês na seção "Previsão de Fatura"
- Ao confirmar pagamento, todas as transações daquele mês vinculadas ao cartão têm o `status` atualizado de `a_pagar` → `pago`
- Faturas pagas somem automaticamente da lista (pois a lista só exibe transações `a_pagar`)
- O limite disponível do cartão é liberado automaticamente como consequência

## Capabilities

### New Capabilities

- `pay-invoice-month`: Capacidade de marcar todas as transações de um mês de fatura de um cartão específico como pagas em lote, com confirmação antes da ação.

### Modified Capabilities

<!-- Nenhuma spec existente muda em nível de requisitos -->

## Impact

- **`src/components/CardsView.tsx`**: Adiciona botão de pagamento em cada linha de mês na seção "Previsão de Fatura"
- **`src/hooks/useFinance.ts`**: Adiciona função `payInvoiceMonth(cardId, monthKey)` que atualiza em lote as transações
- **`src/lib/firebase.ts`** (ou hook): Operação de `writeBatch` no Firestore para atualizar múltiplos documentos atomicamente
