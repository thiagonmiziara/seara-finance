import { transactionFormSchema, type TransactionFormValues } from '@/types';
import type { ChatFlow, FlowContext } from '../types';
import { confirmOptions } from '../engine';
import { parseAmount, capitalize } from '../parse';
import { formatBRL, todayISODate } from '../format';

interface Answers {
  type: 'expense' | 'income';
  description: string;
  amount: number;
  category: string;
}

function getAnswers(ctx: FlowContext): Answers {
  return ctx.answers as unknown as Answers;
}

function categoryLabel(ctx: FlowContext, value: string): string {
  return ctx.data.categories.find((c) => c.value === value)?.label ?? value;
}

export const ADD_TRANSACTION_FLOW: ChatFlow = {
  id: 'add-transaction',
  steps: [
    {
      id: 'type',
      kind: 'options',
      prompt: () => 'É uma despesa (saída) ou uma receita (entrada) de dinheiro?',
      options: () => [
        { id: 'expense', label: '💸 Despesa (saída)' },
        { id: 'income', label: '💰 Receita (entrada)' },
      ],
    },
    {
      id: 'description',
      kind: 'input',
      prompt: () => 'Certo! Qual a descrição? (ex.: Supermercado, Salário de julho)',
      parse: (raw) => {
        const trimmed = raw.trim();
        if (trimmed.length < 2) {
          return {
            ok: false,
            error: 'Escreva uma descrição um pouco maior, com pelo menos 2 letras.',
          };
        }
        return { ok: true, value: capitalize(trimmed) };
      },
    },
    {
      id: 'amount',
      kind: 'input',
      prompt: () => 'Qual o valor? (ex.: 45,90)',
      parse: (raw) => {
        const amount = parseAmount(raw);
        if (amount === null || amount <= 0) {
          return {
            ok: false,
            error: 'Não entendi o valor. Digite só os números, tipo 45,90.',
          };
        }
        return { ok: true, value: amount };
      },
    },
    {
      id: 'category',
      kind: 'options',
      prompt: () => 'Qual a categoria?',
      options: (ctx) =>
        ctx.data.categories.map((c) => ({ id: c.value, label: c.label })),
      emptyText: () => 'Você ainda não tem categorias cadastradas.',
    },
    {
      id: 'confirm',
      kind: 'options',
      placement: 'footer',
      prompt: (ctx) => {
        const a = getAnswers(ctx);
        const typeLabel = a.type === 'expense' ? 'Despesa' : 'Receita';
        return [
          'Confere se está tudo certo:',
          '',
          `${typeLabel}: ${a.description}`,
          `Valor: ${formatBRL(a.amount)}`,
          `Categoria: ${categoryLabel(ctx, a.category)}`,
        ].join('\n');
      },
      options: () => confirmOptions('Sim, salvar'),
    },
    {
      id: 'save',
      kind: 'action',
      run: async (ctx, actions) => {
        const a = getAnswers(ctx);
        const payload: TransactionFormValues = {
          type: a.type,
          description: a.description,
          amount: a.amount,
          category: a.category,
          status: a.type === 'expense' ? 'pago' : 'recebido',
          date: todayISODate(),
        };
        const parsed = transactionFormSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error(
            parsed.error.issues[0]?.message ?? 'Não consegui validar os dados.',
          );
        }
        await actions.addTransaction(parsed.data);
        return `✅ Lançamento salvo: ${formatBRL(a.amount)} em ${a.description}.`;
      },
    },
  ],
};
