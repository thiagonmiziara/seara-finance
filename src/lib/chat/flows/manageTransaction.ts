import type { Transaction } from '@/types';
import type { ChatFlow, FlowContext } from '../types';
import { confirmOptions } from '../engine';
import { formatBRL, formatShortDate } from '../format';

function pickedTransaction(ctx: FlowContext): Transaction {
  return ctx.answers.pick as Transaction;
}

function statusLabel(status: Transaction['status']): string {
  switch (status) {
    case 'pago':
      return 'Pago';
    case 'a_pagar':
      return 'A pagar';
    case 'recebido':
      return 'Recebido';
    case 'a_receber':
      return 'A receber';
  }
}

/** Alterna dentro do mesmo tipo: despesa fica pago<->a_pagar, receita fica recebido<->a_receber. */
function toggledStatus(t: Transaction): Transaction['status'] {
  if (t.type === 'expense') return t.status === 'pago' ? 'a_pagar' : 'pago';
  return t.status === 'recebido' ? 'a_receber' : 'recebido';
}

export const MANAGE_TRANSACTION_FLOW: ChatFlow = {
  id: 'manage-transaction',
  steps: [
    {
      id: 'pick',
      kind: 'options',
      prompt: () => 'Qual transação você quer editar ou excluir?',
      emptyText: () => 'Você não tem transações recentes para gerenciar.',
      options: (ctx) =>
        ctx.data.recentTransactions.slice(0, 8).map((t) => ({
          id: t.id,
          label: t.description,
          sublabel: `${formatBRL(t.amount)} · ${formatShortDate(t.date)} · ${statusLabel(t.status)}`,
          value: t,
        })),
    },
    {
      id: 'action-choice',
      kind: 'options',
      prompt: (ctx) => `O que você quer fazer com "${pickedTransaction(ctx).description}"?`,
      options: (ctx) => {
        const t = pickedTransaction(ctx);
        const toggleLabel =
          t.type === 'expense'
            ? t.status === 'pago'
              ? '↩️ Marcar como a pagar'
              : '✅ Marcar como pago'
            : t.status === 'recebido'
              ? '↩️ Marcar como a receber'
              : '✅ Marcar como recebido';
        return [
          { id: 'toggle-status', label: toggleLabel },
          { id: 'delete', label: '🗑️ Excluir', variant: 'danger' },
        ];
      },
      next: (optionId) => (optionId === 'delete' ? 'confirm-delete' : 'confirm-status'),
    },
    {
      id: 'confirm-status',
      kind: 'options',
      placement: 'footer',
      prompt: (ctx) => {
        const t = pickedTransaction(ctx);
        return `Confirma marcar "${t.description}" como ${statusLabel(toggledStatus(t))}?`;
      },
      options: () => confirmOptions('Sim, mudar'),
    },
    {
      id: 'save-status',
      kind: 'action',
      run: async (ctx, actions) => {
        const t = pickedTransaction(ctx);
        const status = toggledStatus(t);
        await actions.updateTransactionStatus({ id: t.id, status });
        return `✅ "${t.description}" agora está ${statusLabel(status)}.`;
      },
    },
    {
      id: 'confirm-delete',
      kind: 'options',
      placement: 'footer',
      prompt: (ctx) => {
        const t = pickedTransaction(ctx);
        return `Tem certeza que quer excluir "${t.description}" (${formatBRL(t.amount)})? Essa ação não pode ser desfeita.`;
      },
      options: () => confirmOptions('Sim, excluir', 'Não, manter', 'danger'),
    },
    {
      id: 'save-delete',
      kind: 'action',
      run: async (ctx, actions) => {
        const t = pickedTransaction(ctx);
        await actions.removeTransaction(t.id);
        return `🗑️ "${t.description}" foi excluída.`;
      },
    },
  ],
};
