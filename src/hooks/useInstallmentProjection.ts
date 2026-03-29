import { useMemo } from 'react';
import { useFinance } from './useFinance';
import { useCards } from './useCards';
import { Transaction } from '@/types';

export interface MonthProjection {
  month: string;       // "2026-07"
  label: string;       // "jul./26"
  totalInstallments: number;
  limitUsedPercent: number;
  parcelas: Array<{
    description: string;
    amount: number;
    currentInstallment: number;
    totalInstallments: number;
    category: string;
  }>;
}

export function useInstallmentProjection(cardId: string | undefined) {
  const { allTransactions } = useFinance();
  const { cards } = useCards();

  const projection = useMemo(() => {
    if (!cardId) return { months: [], criticalMonth: null };

    const card = cards.find(c => c.id === cardId);
    if (!card) return { months: [], criticalMonth: null };

    const limit = card.limit || 0;
    const now = new Date();
    const months: MonthProjection[] = [];

    for (let i = 1; i <= 12; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = targetDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      // Filter installment transactions due in this month for this card
      const monthParcelas = allTransactions
        .filter((tx: Transaction) => {
          if (tx.cardId !== cardId) return false;
          if (tx.status !== 'a_pagar') return false;
          if (!tx.installments || tx.installments.total <= 1) return false;

          // Check if this transaction is due in the target month
          if (!tx.date) return false;
          const txDate = tx.date.includes('T') ? tx.date.split('T')[0] : tx.date;
          const txMonth = txDate.substring(0, 7); // "2026-07"
          return txMonth === monthKey;
        })
        .map((tx: Transaction) => ({
          description: tx.description,
          amount: tx.amount,
          currentInstallment: tx.installments?.current || 1,
          totalInstallments: tx.installments?.total || 1,
          category: tx.category || 'Outros',
        }));

      const totalInstallments = monthParcelas.reduce((sum, p) => sum + p.amount, 0);
      const limitUsedPercent = limit > 0 ? Math.round((totalInstallments / limit) * 100) : 0;

      months.push({
        month: monthKey,
        label: monthLabel,
        totalInstallments,
        limitUsedPercent,
        parcelas: monthParcelas,
      });
    }

    const criticalMonth = months.reduce((max, m) =>
      m.limitUsedPercent > (max?.limitUsedPercent || 0) ? m : max, months[0] || null);

    return { months, criticalMonth };
  }, [allTransactions, cards, cardId]);

  return projection;
}
