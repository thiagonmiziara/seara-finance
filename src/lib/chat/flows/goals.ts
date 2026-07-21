import type { GoalWithProgress } from '@/types';
import type { ChatFlow, FlowContext } from '../types';
import { confirmOptions } from '../engine';
import { parseAmount } from '../parse';
import { formatBRL, todayISODate } from '../format';

function pickedGoal(ctx: FlowContext): GoalWithProgress {
  return ctx.answers.pick as GoalWithProgress;
}

function amountAnswer(ctx: FlowContext): number {
  return ctx.answers.amount as number;
}

export const GOAL_CONTRIBUTION_FLOW: ChatFlow = {
  id: 'goal-contribution',
  steps: [
    {
      id: 'pick',
      kind: 'options',
      prompt: () => 'Em qual objetivo você quer guardar dinheiro?',
      emptyText: () =>
        'Você ainda não tem objetivos ativos. Crie um na página Objetivos!',
      options: (ctx) =>
        ctx.data.activeGoals.map((g) => ({
          id: g.id,
          label: g.title,
          sublabel: `${formatBRL(g.currentAmount)} de ${formatBRL(g.targetAmount)} (${Math.round(g.progress * 100)}%)`,
          value: g,
        })),
    },
    {
      id: 'amount',
      kind: 'input',
      prompt: (ctx) => `Quanto você quer guardar em "${pickedGoal(ctx).title}"?`,
      parse: (raw) => {
        const amount = parseAmount(raw);
        if (amount === null || amount <= 0) {
          return {
            ok: false,
            error: 'Não entendi o valor. Digite só os números, tipo 100,00.',
          };
        }
        return { ok: true, value: amount };
      },
    },
    {
      id: 'confirm',
      kind: 'options',
      placement: 'footer',
      prompt: (ctx) =>
        `Confirma guardar ${formatBRL(amountAnswer(ctx))} em "${pickedGoal(ctx).title}"?`,
      options: () => confirmOptions('Sim, guardar'),
    },
    {
      id: 'save',
      kind: 'action',
      run: async (ctx, actions) => {
        const g = pickedGoal(ctx);
        const amount = amountAnswer(ctx);
        await actions.addContribution({
          goalId: g.id,
          amount,
          contributedAt: todayISODate(),
          note: 'Via assistente',
        });
        return `🎯 Guardado! "${g.title}" agora tem ${formatBRL(g.currentAmount + amount)} de ${formatBRL(g.targetAmount)}.`;
      },
    },
  ],
};
