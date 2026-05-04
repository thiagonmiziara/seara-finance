import { useMemo } from 'react';
import { addMonths, endOfDay, format, startOfDay, startOfMonth } from 'date-fns';
import { Transaction } from '@/types';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import type { DateRange } from '@/hooks/useFinance';

/**
 * Computes virtual (projected) transactions for active recurring bills that
 * have not yet been materialized as real transactions in the given range.
 */
export function useProjectedTransactions(
  dateRange: DateRange,
  allTransactions: Transaction[],
) {
  const { recurringBills } = useRecurringBills();

  return useMemo<Transaction[]>(() => {
    const projected: Transaction[] = [];
    const activeBills = recurringBills.filter((b) => b.isActive);
    if (!activeBills.length) return projected;

    const currentMonth = startOfMonth(new Date());
    const monthsToCheck: Date[] = [];
    let d = startOfMonth(dateRange.from);
    const end = startOfMonth(dateRange.to);

    while (d <= end) {
      if (d >= currentMonth) {
        monthsToCheck.push(d);
      }
      d = addMonths(d, 1);
    }

    if (!monthsToCheck.length) return projected;

    monthsToCheck.forEach((monthDate) => {
      const yearMonth = format(monthDate, 'yyyy-MM');
      activeBills.forEach((bill) => {
        const exists = allTransactions.some(
          (t) =>
            t.recurringBillId === bill.id && t.recurringYearMonth === yearMonth,
        );
        if (exists) return;

        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const dueDay = Math.min(
          bill.dueDay,
          new Date(year, month + 1, 0).getDate(),
        );
        const projectedDate = new Date(year, month, dueDay, 12, 0, 0)
          .toISOString()
          .split('T')[0];

        const txDate = startOfDay(new Date(year, month, dueDay, 12, 0, 0));
        if (
          txDate >= startOfDay(dateRange.from) &&
          txDate <= endOfDay(dateRange.to)
        ) {
          projected.push({
            id: `virtual-${bill.id}-${yearMonth}`,
            description:
              bill.description +
              (bill.type === 'expense' ? ' (Dívida Fixa)' : ' (Receita Fixa)'),
            amount: bill.amount,
            type: bill.type,
            category: bill.category,
            date: projectedDate,
            status: 'a_pagar',
            createdAt: new Date().toISOString(),
            recurringBillId: bill.id,
            recurringYearMonth: yearMonth,
            isProjected: true,
          } as Transaction);
        }
      });
    });

    return projected;
  }, [recurringBills, dateRange, allTransactions]);
}
