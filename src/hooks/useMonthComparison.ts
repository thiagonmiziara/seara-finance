import { useMemo } from 'react';
import { Transaction } from '@/types';
import { getMonthRange } from '@/lib/dateHelpers';
import { aggregateTransactions, CategoryAggregate } from '@/lib/aggregate';

export type ComparisonCategory = {
  category: string;
  label: string;
  color: string;
  monthA: number;
  monthB: number;
  difference: number;
  percentChange: number;
};

export function useMonthComparison(transactions: Transaction[]) {
  const memoTx = useMemo(() => transactions || [], [transactions]);

  function getComparison(
    monthA: Date,
    monthB: Date,
    mode: 'category' | 'total' = 'category',
    transactionType: 'expense' | 'income' | 'both' = 'expense',
  ) {
    const rangeA = getMonthRange(monthA);
    const rangeB = getMonthRange(monthB);

    if (mode === 'total') {
      const totalA = aggregateTransactions(
        memoTx,
        rangeA,
        'total',
        transactionType,
      ) as number;
      const totalB = aggregateTransactions(
        memoTx,
        rangeB,
        'total',
        transactionType,
      ) as number;
      const diff = totalA - totalB;
      const percent =
        totalB === 0 ? (totalA === 0 ? 0 : 100) : (diff / totalB) * 100;
      return {
        monthA: totalA,
        monthB: totalB,
        difference: diff,
        percentChange: Number(percent.toFixed(2)),
      };
    }

    const aggA = aggregateTransactions(
      memoTx,
      rangeA,
      'category',
      transactionType,
    ) as CategoryAggregate[];
    const aggB = aggregateTransactions(
      memoTx,
      rangeB,
      'category',
      transactionType,
    ) as CategoryAggregate[];

    const mapB = new Map<string, number>();
    aggB.forEach((a) => mapB.set(a.category, a.amount));

    const categories: ComparisonCategory[] = aggA.map((a) => {
      const bAmount = mapB.get(a.category) || 0;
      const diff = a.amount - bAmount;
      const percent =
        bAmount === 0 ? (a.amount === 0 ? 0 : 100) : (diff / bAmount) * 100;
      return {
        category: a.category,
        label: a.label,
        color: a.color,
        monthA: Number(a.amount),
        monthB: Number(bAmount),
        difference: Number(diff),
        percentChange: Number(percent.toFixed(2)),
      };
    });

    return categories;
  }

  return { getComparison };
}
