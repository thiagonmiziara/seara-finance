import { useEffect, useRef } from 'react';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { useRecurringBills } from './useRecurringBills';
import { format } from 'date-fns';

/**
 * Automatically generates a "a_pagar" / "a_receber" transaction for each
 * active recurring bill when the current month hasn't been generated yet.
 * Uses `recurringBillId + recurringYearMonth` as a deduplication key.
 */
export function useRecurringBillsSync() {
  const { user } = useAuth();
  const { accountType } = useAccount();
  const { recurringBills } = useRecurringBills();
  // Track which months we've already synced in this session to avoid repeated Firestore calls
  const syncedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || recurringBills.length === 0) return;

    const now = new Date();
    const yearMonth = format(now, 'yyyy-MM'); // e.g. "2026-03"

    const syncKey = `${user.id}-${accountType}-${yearMonth}`;
    if (syncedRef.current.has(syncKey)) return;

    const activeBills = recurringBills.filter((b) => b.isActive);
    if (activeBills.length === 0) return;

    (async () => {
      try {
        const txRef = collection(
          db,
          'users',
          user.id,
          'accounts',
          accountType,
          'transactions',
        );

        // Fetch existing generated transactions for this month
        const existingSnap = await getDocs(
          query(txRef, where('recurringYearMonth', '==', yearMonth)),
        );
        const existingBillIds = new Set(
          existingSnap.docs.map((d) => d.data().recurringBillId as string),
        );

        // Only create for bills that haven't been generated yet this month
        const missing = activeBills.filter(
          (b) => !existingBillIds.has(b.id),
        );

        if (missing.length === 0) {
          syncedRef.current.add(syncKey);
          return;
        }

        const batch = writeBatch(db);
        for (const bill of missing) {
          // Build due date: current year-month + dueDay
          const dueDay = Math.min(
            bill.dueDay,
            new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), // last day of month
          );
          const dueDate = `${yearMonth}-${String(dueDay).padStart(2, '0')}`;

          const newRef = doc(collection(txRef));
          batch.set(newRef, {
            description: bill.description,
            amount: bill.amount,
            category: bill.category,
            type: bill.type,
            status: bill.type === 'income' ? 'a_receber' : 'a_pagar',
            date: dueDate,
            createdAt: new Date().toISOString(),
            recurringBillId: bill.id,
            recurringYearMonth: yearMonth,
          });
        }

        await batch.commit();
        syncedRef.current.add(syncKey);
      } catch (e) {
        console.error('[RecurringBillsSync] Error generating transactions:', e);
      }
    })();
  }, [user, accountType, recurringBills]);
}
