import type { ChatFlow } from '../types';

/**
 * Menu raiz. Cada opção aponta (via `next`) para o primeiro step de outro
 * fluxo no registro (`flowId::stepId`). Fluxos ainda não implementados são
 * tratados de forma graciosa pelo engine ("ainda não disponível").
 */
export const MENU_FLOW: ChatFlow = {
  id: 'menu',
  steps: [
    {
      id: 'root',
      kind: 'options',
      prompt: () => 'Oi! Eu sou o assistente do Seara Finance. O que você quer fazer?',
      placement: 'bubble',
      options: () => [
        { id: 'add-transaction', label: '➕ Lançar uma transação' },
        { id: 'manage-transaction', label: '🧾 Editar ou excluir uma transação' },
        { id: 'summary', label: '📊 Ver resumo do mês' },
        { id: 'pay-debt', label: '💳 Pagar uma dívida' },
        { id: 'goal-contribution', label: '🎯 Guardar dinheiro numa meta' },
      ],
      // '@first' entra no primeiro step do fluxo alvo (ver resolveRef).
      next: (optionId) => `${optionId}::@first`,
    },
  ],
};
