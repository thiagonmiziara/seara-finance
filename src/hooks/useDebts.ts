import { useEffect, useMemo, useRef } from 'react';
import { Debt, DebtFormValues, DebtPayment } from '../types';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stripUndefined } from '@/lib/firestore';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addMonths, parseISO } from 'date-fns';

function safeParse(value: string): Date | null {
  if (!value) return null;
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`);
    }
    return parseISO(value);
  } catch {
    return null;
  }
}

export function useDebts() {
  const { user } = useAuth();
  const { accountType } = useAccount();
  const queryClient = useQueryClient();
  const queryKey = ['debts', user?.id, accountType];
  // Tracks debts whose paymentHistory was already backfilled this session
  const backfilledRef = useRef<Set<string>>(new Set());

  const { data: debts = [], isPending } = useQuery<Debt[]>({
    queryKey,
    queryFn: () => [],
    enabled: !!user,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.id, 'accounts', accountType, 'debts'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbts = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        const normalizeDate = (val: any) => {
          if (!val) return val;
          if (typeof val.toDate === 'function') {
            return val.toDate().toISOString();
          }
          if (val.seconds !== undefined && val.nanoseconds !== undefined) {
            return new Date(
              val.seconds * 1000 + Math.floor(val.nanoseconds / 1e6),
            ).toISOString();
          }
          return val;
        };

        return {
          ...data,
          id: doc.id,
          dueDate: normalizeDate(data.dueDate),
          createdAt: normalizeDate(data.createdAt),
        } as Debt;
      });

      queryClient.setQueryData(queryKey, dbts);

      // One-time migration per session:
      // 1) backfill missing paymentHistory entries (paidInstallments > history.length)
      // 2) clamp any existing entries with paidAt in the future down to today
      // Synthetic date: min(dueDate + (n-1) meses, hoje) — never in the future,
      // since we only know the parcela was paid by now.
      const nowMs = Date.now();
      const todayIso = new Date().toISOString();
      const updates: Array<{ id: string; merged: DebtPayment[] }> = [];
      for (const debt of dbts) {
        if (backfilledRef.current.has(debt.id)) continue;
        const paid = debt.paidInstallments ?? 0;
        const history = debt.paymentHistory ?? [];
        const due = debt.dueDate ? safeParse(debt.dueDate) : null;

        // Clamp future-dated existing entries to today
        let clampedHistory = history;
        let needsClamp = false;
        if (history.some((h) => new Date(h.paidAt).getTime() > nowMs)) {
          clampedHistory = history.map((h) =>
            new Date(h.paidAt).getTime() > nowMs
              ? { ...h, paidAt: todayIso }
              : h,
          );
          needsClamp = true;
        }

        const existing = new Set(clampedHistory.map((h) => h.installmentNumber));
        const missing: DebtPayment[] = [];
        for (let n = 1; n <= paid; n++) {
          if (existing.has(n)) continue;
          let paidAtDate = due ? addMonths(due, n - 1) : new Date();
          if (paidAtDate.getTime() > nowMs) paidAtDate = new Date();
          missing.push({
            installmentNumber: n,
            paidAt: paidAtDate.toISOString(),
            amount: debt.installmentAmount,
          });
        }

        if (needsClamp || missing.length > 0) {
          const merged = [...clampedHistory, ...missing].sort(
            (a, b) => a.installmentNumber - b.installmentNumber,
          );
          updates.push({ id: debt.id, merged });
        }
        backfilledRef.current.add(debt.id);
      }

      if (updates.length > 0) {
        const batch = writeBatch(db);
        for (const { id, merged } of updates) {
          const ref = doc(
            db,
            'users',
            user.id,
            'accounts',
            accountType,
            'debts',
            id,
          );
          batch.update(ref, { paymentHistory: merged });
        }
        batch.commit().catch((err) => {
          console.error('[useDebts] paymentHistory backfill failed:', err);
        });
      }
    });

    return () => unsubscribe();
  }, [user, accountType, queryClient, queryKey]);

  const addMutation = useMutation({
    mutationFn: async (data: DebtFormValues) => {
      if (!user) throw new Error('User not authenticated');
      // Build the doc explicitly so optional fields (cardId, paidInstallments)
      // are only included when they actually have a value. Firestore rejects
      // writes with `undefined` field values.
      const docData: Record<string, unknown> = {
        description: data.description,
        totalAmount: data.totalAmount,
        installments: data.installments,
        installmentAmount: data.installmentAmount,
        dueDate: data.dueDate,
        status: data.status,
        paidInstallments: 0,
        createdAt: new Date().toISOString(),
      };
      if (data.cardId) docData.cardId = data.cardId;
      return addDoc(
        collection(db, 'users', user.id, 'accounts', accountType, 'debts'),
        docData,
      );
    },
    onMutate: async (newDebt) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDebts = queryClient.getQueryData<Debt[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Debt[] = []) => [
        {
          ...newDebt,
          id: 'temp-id',
          createdAt: new Date().toISOString(),
        } as Debt,
        ...old,
      ]);

      return { previousDebts };
    },
    onError: (_err, _newDebt, context) => {
      if (context?.previousDebts) {
        queryClient.setQueryData(queryKey, context.previousDebts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<DebtFormValues> & { paymentHistory?: DebtPayment[] };
    }) => {
      if (!user) throw new Error('User not authenticated');
      return updateDoc(
        doc(db, 'users', user.id, 'accounts', accountType, 'debts', id),
        stripUndefined(data),
      );
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDebts = queryClient.getQueryData<Debt[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Debt[] = []) =>
        old.map((d) => (d.id === id ? { ...d, ...data } : d)),
      );

      return { previousDebts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousDebts) {
        queryClient.setQueryData(queryKey, context.previousDebts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      return deleteDoc(
        doc(db, 'users', user.id, 'accounts', accountType, 'debts', id),
      );
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDebts = queryClient.getQueryData<Debt[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Debt[] = []) =>
        old.filter((d) => d.id !== id),
      );

      return { previousDebts };
    },
    onError: (_err, _id, context) => {
      if (context?.previousDebts) {
        queryClient.setQueryData(queryKey, context.previousDebts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const incrementInstallment = async (debt: Debt) => {
    const currentPaid = debt.paidInstallments || 0;
    const newPaid = currentPaid + 1;

    let newStatus = debt.status;
    if (newPaid >= debt.installments) {
      newStatus = 'pago';
    }

    const history = debt.paymentHistory ?? [];
    const newEntry: DebtPayment = {
      installmentNumber: newPaid,
      paidAt: new Date().toISOString(),
      amount: debt.installmentAmount,
    };

    return updateMutation.mutateAsync({
      id: debt.id,
      data: {
        paidInstallments: newPaid,
        status: newStatus,
        paymentHistory: [...history, newEntry],
      },
    });
  };

  const settleDebt = async (debt: Debt) => {
    const currentPaid = debt.paidInstallments || 0;
    const history = debt.paymentHistory ?? [];
    const now = new Date().toISOString();
    const remainingEntries: DebtPayment[] = [];
    for (let i = currentPaid + 1; i <= debt.installments; i++) {
      remainingEntries.push({
        installmentNumber: i,
        paidAt: now,
        amount: debt.installmentAmount,
      });
    }

    return updateMutation.mutateAsync({
      id: debt.id,
      data: {
        paidInstallments: debt.installments,
        status: 'pago',
        paymentHistory: [...history, ...remainingEntries],
      },
    });
  };

  const unmarkLastInstallment = async (debt: Debt) => {
    const currentPaid = debt.paidInstallments || 0;
    if (currentPaid <= 0) return;
    const newPaid = currentPaid - 1;
    const history = debt.paymentHistory ?? [];
    // Remove the most recently logged entry for the last installment
    const idx = [...history]
      .map((p, i) => ({ p, i }))
      .reverse()
      .find((x) => x.p.installmentNumber === currentPaid)?.i;
    const newHistory =
      idx !== undefined
        ? [...history.slice(0, idx), ...history.slice(idx + 1)]
        : history;

    return updateMutation.mutateAsync({
      id: debt.id,
      data: {
        paidInstallments: newPaid,
        status: 'a_pagar',
        paymentHistory: newHistory,
      },
    });
  };

  const summary = useMemo(() => {
    return debts.reduce(
      (acc, d) => {
        const paidInstallments = d.paidInstallments || 0;
        const paidAmount = paidInstallments * d.installmentAmount;
        const remainingAmount = d.totalAmount - paidAmount;
        const isActive =
          d.status !== 'pago' && paidInstallments < d.installments;

        acc.total += d.totalAmount;
        acc.paid += paidAmount;
        acc.remaining += remainingAmount;
        if (isActive) acc.monthlyPayment += d.installmentAmount;

        return acc;
      },
      { total: 0, paid: 0, remaining: 0, monthlyPayment: 0 },
    );
  }, [debts]);

  return {
    debts,
    addDebt: addMutation.mutateAsync,
    updateDebt: updateMutation.mutateAsync,
    removeDebt: deleteMutation.mutateAsync,
    incrementInstallment,
    settleDebt,
    unmarkLastInstallment,
    summary,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isInitialLoading: isPending && user !== null,
    isLoading:
      isPending ||
      addMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
