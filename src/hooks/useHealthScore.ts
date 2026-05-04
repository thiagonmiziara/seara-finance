import { useMemo } from 'react';
import { useFinance } from './useFinance';
import { useCards } from './useCards';

export interface ScoreBreakdown {
  limitUsage: number;      // 0-30
  punctuality: number;     // 0-30
  diversification: number; // 0-20
  trend: number;           // 0-20
}

export interface HealthScore {
  total: number;
  breakdown: ScoreBreakdown;
}

export function useHealthScore() {
  const { allTransactions } = useFinance();
  const { cards } = useCards();

  const score = useMemo<HealthScore | null>(() => {
    if (!allTransactions.length) return null;

    // Pilar 1: Uso de Limite (0-30pts)
    // Quanto menos limite usado, melhor.
    // Sem cartões = sem dívida de crédito → pontuação cheia.
    const totalLimit = cards.reduce((s, c) => s + (c.limit || 0), 0);
    const totalUsed = allTransactions
      .filter(tx => tx.status === 'a_pagar' && tx.cardId)
      .reduce((s, tx) => s + tx.amount, 0);
    const limitUsage =
      totalLimit > 0
        ? Math.round((1 - Math.min(totalUsed / totalLimit, 1)) * 30)
        : 30;

    // Pilar 2: Pontualidade (0-30pts)
    // Proporção de transações pagas vs total
    const paidTx = allTransactions.filter(tx => tx.status === 'pago' || tx.status === 'recebido');
    const allPayable = allTransactions.filter(tx =>
      tx.status === 'pago' || tx.status === 'a_pagar' ||
      tx.status === 'recebido' || tx.status === 'a_receber'
    );
    const punctuality = allPayable.length > 0
      ? Math.round((paidTx.length / allPayable.length) * 30)
      : 30;

    // Pilar 3: Diversificação (0-20pts)
    // Categorias únicas usadas (max 5 = 20pts)
    const categories = new Set(allTransactions.map(tx => tx.category).filter(Boolean));
    const diversification = Math.min(categories.size * 4, 20);

    // Pilar 4: Tendência (0-20pts)
    // Gasto deste mês vs mês passado — gasta menos = melhor
    const now = new Date();
    const thisMonthExpenses = allTransactions.filter(tx => {
      if (tx.type !== 'expense' || !tx.date) return false;
      const d = new Date(tx.date.includes('T') ? tx.date : `${tx.date}T00:00:00`);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, tx) => s + tx.amount, 0);

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthExpenses = allTransactions.filter(tx => {
      if (tx.type !== 'expense' || !tx.date) return false;
      const d = new Date(tx.date.includes('T') ? tx.date : `${tx.date}T00:00:00`);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }).reduce((s, tx) => s + tx.amount, 0);

    let trend: number;
    if (lastMonthExpenses > 0 && thisMonthExpenses < lastMonthExpenses) {
      trend = 20; // Gastou menos — ótimo
    } else if (lastMonthExpenses > 0) {
      const increase = (thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses;
      trend = Math.max(0, 20 - Math.round(increase * 20));
    } else {
      trend = 10; // Sem referência
    }

    const total = limitUsage + punctuality + diversification + trend;

    return {
      total,
      breakdown: { limitUsage, punctuality, diversification, trend },
    };
  }, [allTransactions, cards]);

  return { score, loading: false };
}
