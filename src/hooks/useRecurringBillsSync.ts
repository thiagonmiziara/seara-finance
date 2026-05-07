import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { useRecurringBills } from './useRecurringBills';

/**
 * Generates an `a_pagar` / `a_receber` transaction for each active recurring
 * bill when the current month hasn't been generated yet. Deduplication uses
 * the partial unique pair (recurring_bill_id, recurring_year_month).
 */
export function useRecurringBillsSync() {
  const { user } = useAuth();
  const { accountId } = useAccount();
  const { recurringBills } = useRecurringBills();
  const syncedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !accountId || recurringBills.length === 0) return;

    const now = new Date();
    const yearMonth = format(now, 'yyyy-MM');
    const syncKey = `${user.id}-${accountId}-${yearMonth}`;
    if (syncedRef.current.has(syncKey)) return;

    const activeBills = recurringBills.filter((b) => b.isActive);
    if (activeBills.length === 0) {
      syncedRef.current.add(syncKey);
      return;
    }

    (async () => {
      try {
        const { data: existing, error } = await supabase
          .from('transactions')
          .select('recurring_bill_id')
          .eq('account_id', accountId)
          .eq('recurring_year_month', yearMonth);
        if (error) throw error;

        const existingBillIds = new Set(
          (existing ?? [])
            .map((r: { recurring_bill_id: string | null }) => r.recurring_bill_id)
            .filter(Boolean),
        );

        const missing = activeBills.filter((b) => !existingBillIds.has(b.id));
        if (missing.length === 0) {
          syncedRef.current.add(syncKey);
          return;
        }

        const lastDayOfMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
        ).getDate();

        const rows = missing.map((bill) => {
          const dueDay = Math.min(bill.dueDay, lastDayOfMonth);
          return {
            account_id: accountId,
            description: bill.description,
            amount: bill.amount,
            category: bill.category,
            type: bill.type,
            status: bill.type === 'income' ? 'a_receber' : 'a_pagar',
            date: `${yearMonth}-${String(dueDay).padStart(2, '0')}`,
            recurring_bill_id: bill.id,
            recurring_year_month: yearMonth,
          };
        });

        const { error: insertErr } = await supabase
          .from('transactions')
          .insert(rows);
        if (insertErr) throw insertErr;

        syncedRef.current.add(syncKey);
      } catch (e) {
        console.error('[RecurringBillsSync] generation error', e);
      }
    })();
  }, [user, accountId, recurringBills]);
}
