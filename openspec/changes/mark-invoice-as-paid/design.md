## Context

A seção "Previsão de Fatura" em `CardsView.tsx` exibe transações com `status === 'a_pagar'` agrupadas por mês. Não há forma de marcar um mês como pago, então faturas antigas permanecem visíveis indefinidamente, tornando a lista ruidosa.

O modelo de dados atual usa `status` na `Transaction` com valores `pago | a_pagar | recebido | a_receber`. Marcar todas as transações de um mês como `pago` é suficiente para fazê-las desaparecer da lista (que filtra apenas `a_pagar`) e liberar o limite do cartão.

## Goals / Non-Goals

**Goals:**

- Permitir marcar todas as transações de um mês de fatura de um cartão como `pago` em lote
- A operação deve ser atômica (Firestore `writeBatch`)
- Confirmação visual antes de executar a ação (para evitar cliques acidentais)
- Feedback de loading durante a operação

**Non-Goals:**

- Criar um conceito novo de "fatura" como entidade própria no banco
- Desfazer pagamento (pode ser futuro)
- Pagamento automático por agendamento
- Marcar transações individuais dentro do mês

## Decisions

### Decisão: Atualizar `status` das transações existentes (Opção A)

**Escolha**: Quando o usuário clica "Pagar fatura de [mês]", todas as transações vinculadas ao cartão naquele mês têm `status` atualizado de `a_pagar` → `pago`.

**Alternativas consideradas**:

- Criar entidade "fatura" separada — descartada por aumentar complexidade e criar risco de dessincronia com transações
- Soft-delete da fatura — descartada por perder histórico

**Rationale**: A Opção A reutiliza o modelo existente, é consistente com como parcelas de dívidas são tratadas, e o efeito colateral de liberar o limite é correto e esperado pelo usuário.

### Decisão: Confirmação inline via botão com estado de loading, sem dialog modal

**Escolha**: Um botão pequeno ao lado do valor de cada mês. Double-action: primeiro clique mostra confirmação inline; segundo clique executa. Sem abrir modal, para manter a UX leve.

**Alternativas consideradas**:

- Modal de confirmação — mais pesado para uma ação pontual
- Clique único sem confirmação — arriscado, sem feedback de loading

### Decisão: `writeBatch` no Firestore no hook `useFinance`

**Escolha**: Adicionar função `payInvoiceMonth(cardId, yearMonth)` no hook `useFinance`, que busca as transações do mês via cache local (já carregadas) e faz batch update no Firestore.

**Rationale**: O cache React Query já tem as transações; não é necessário fazer nova query. O `writeBatch` garante atomicidade.

## Risks / Trade-offs

- **[Risk] Batch grande**: Se o usuário tem muitas transações em um mês (>500), o Firestore batch limit pode ser atingido. → Mitigation: Improvável no contexto de uso pessoal; documentar limite se necessário.
- **[Risk] Clique acidental**: Usuário pode marcar mês errado como pago. → Mitigation: Confirmação de dois passos (clique → confirmar → executar).
