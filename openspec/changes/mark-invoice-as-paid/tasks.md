## 1. Hook - Função de pagamento em lote

- [x] 1.1 Adicionar função `payInvoiceMonth(cardId: string, yearMonth: string)` no hook `useFinance` usando `writeBatch` do Firestore para atualizar `status` de `a_pagar` → `pago` das transações do mês/cartão

## 2. UI - Botão de pagamento por mês

- [x] 2.1 Adicionar estado de confirmação pendente em `CardsView` para rastrear qual mês está aguardando confirmação (`pendingPayMonth: Record<string, string | null>`)
- [x] 2.2 Adicionar botão de pagar fatura em cada linha de mês na seção "Previsão de Fatura" (ícone `Check` / `CreditCard`)
- [x] 2.3 Implementar lógica de dois passos: primeiro clique define `pendingPayMonth`, segundo clique executa `payInvoiceMonth` e limpa o estado
- [x] 2.4 Exibir estado de loading no botão durante a execução do `payInvoiceMonth` (desabilitar interação)
