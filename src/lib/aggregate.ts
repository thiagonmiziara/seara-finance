import { Transaction } from '@/types';
import { CATEGORIES } from '@/lib/categories';

export type CategoryAggregate = {
  category: string;
  label: string;
  color: string;
  amount: number;
};

export function aggregateTransactions(
  transactions: Transaction[],
  range: { from: Date; to: Date },
  mode: 'category' | 'total' = 'category',
  transactionType: 'expense' | 'income' | 'both' = 'expense',
): CategoryAggregate[] | number {
  const { from, to } = range;

  const filtered = transactions.filter((t) => {
    const d = new Date(t.date);
    if (!(d >= from && d <= to)) return false;
    if (transactionType === 'both') return true;
    return t.type === transactionType;
  });

  if (mode === 'total') {
    return filtered.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }

  const map = new Map<string, number>();

  filtered.forEach((t) => {
    const key = t.category || 'outros';
    map.set(key, (map.get(key) || 0) + Number(t.amount || 0));
  });

  const results: CategoryAggregate[] = CATEGORIES.map((c) => ({
    category: c.value,
    label: c.label,
    color: c.color,
    amount: map.get(c.value) || 0,
  }));

  // include any uncategorized categories
  if (map.has('outros')) {
    results.push({
      category: 'outros',
      label: 'Outros',
      color: '#9CA3AF',
      amount: map.get('outros') || 0,
    });
  }

  return results.sort((a, b) => b.amount - a.amount);
}
