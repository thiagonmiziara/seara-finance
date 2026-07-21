import type { ChatFlow, FlowContext } from '../types';
import { formatBRL, formatShortDate } from '../format';

function buildSummaryText(ctx: FlowContext): string {
  const { income, expense, balance } = ctx.data.monthSummary;
  const lines = [
    `📊 *Resumo do mês*`,
    `Entradas: ${formatBRL(income)}`,
    `Saídas: ${formatBRL(expense)}`,
    `Saldo: ${formatBRL(balance)}`,
  ];

  const recent = ctx.data.recentTransactions.slice(0, 5);
  if (recent.length > 0) {
    lines.push('', '🧾 Últimos lançamentos:');
    for (const t of recent) {
      const sign = t.type === 'income' ? '+' : '-';
      lines.push(
        `${formatShortDate(t.date)} · ${t.description} · ${sign}${formatBRL(t.amount)}`,
      );
    }
  } else {
    lines.push('', 'Você ainda não tem lançamentos este mês.');
  }

  return lines.join('\n');
}

export const SUMMARY_FLOW: ChatFlow = {
  id: 'summary',
  steps: [{ id: 'start', kind: 'message', text: buildSummaryText }],
};
