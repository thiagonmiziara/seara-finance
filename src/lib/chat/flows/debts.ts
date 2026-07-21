import type { Debt } from '@/types';
import type { ChatFlow, FlowContext } from '../types';
import { confirmOptions } from '../engine';
import { formatBRL } from '../format';

function pickedDebt(ctx: FlowContext): Debt {
  return ctx.answers.pick as Debt;
}

function remainingInstallments(d: Debt): number {
  return d.installments - (d.paidInstallments ?? 0);
}

export const PAY_DEBT_FLOW: ChatFlow = {
  id: 'pay-debt',
  steps: [
    {
      id: 'pick',
      kind: 'options',
      prompt: () => 'Qual dívida você quer pagar?',
      emptyText: () => 'Você não tem dívidas ativas! 🎉',
      options: (ctx) =>
        ctx.data.activeDebts.map((d) => ({
          id: d.id,
          label: d.description,
          sublabel: `Parcela ${(d.paidInstallments ?? 0) + 1}/${d.installments} · ${formatBRL(d.installmentAmount)}`,
          value: d,
        })),
    },
    {
      id: 'action-choice',
      kind: 'options',
      prompt: (ctx) => `O que você quer fazer com "${pickedDebt(ctx).description}"?`,
      options: (ctx) => {
        const d = pickedDebt(ctx);
        const remaining = remainingInstallments(d);
        const options = [
          { id: 'pay-one', label: `💳 Pagar 1 parcela (${formatBRL(d.installmentAmount)})` },
        ];
        if (remaining > 1) {
          options.push({
            id: 'settle',
            label: `✅ Quitar tudo (${formatBRL(d.installmentAmount * remaining)})`,
          });
        }
        return options;
      },
      next: (optionId) => (optionId === 'settle' ? 'confirm-settle' : 'confirm-pay'),
    },
    {
      id: 'confirm-pay',
      kind: 'options',
      placement: 'footer',
      prompt: (ctx) => {
        const d = pickedDebt(ctx);
        return `Confirma pagar 1 parcela de "${d.description}" (${formatBRL(d.installmentAmount)})?`;
      },
      options: () => confirmOptions('Sim, pagar'),
    },
    {
      id: 'save-pay',
      kind: 'action',
      run: async (ctx, actions) => {
        const d = pickedDebt(ctx);
        await actions.incrementInstallment(d);
        const paid = (d.paidInstallments ?? 0) + 1;
        return `✅ Parcela paga! "${d.description}" agora está ${paid}/${d.installments}.`;
      },
    },
    {
      id: 'confirm-settle',
      kind: 'options',
      placement: 'footer',
      prompt: (ctx) => {
        const d = pickedDebt(ctx);
        const remaining = remainingInstallments(d);
        return `Confirma quitar as ${remaining} parcelas restantes de "${d.description}" (${formatBRL(d.installmentAmount * remaining)})?`;
      },
      options: () => confirmOptions('Sim, quitar tudo'),
    },
    {
      id: 'save-settle',
      kind: 'action',
      run: async (ctx, actions) => {
        const d = pickedDebt(ctx);
        await actions.settleDebt(d);
        return `✅ "${d.description}" foi totalmente quitada!`;
      },
    },
  ],
};
