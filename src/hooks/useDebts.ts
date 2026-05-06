import { useEffect, useMemo, useRef } from 'react';
import { Debt, DebtFormValues, DebtPayment } from '../types';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stripUndefined } from '@/lib/firestore';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addMonths, format, parseISO } from 'date-fns';

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

      // One-time migration per session per debt. Runs async (uses getDocs).
      // Goals:
      // 1) Add missing paymentHistory entries (paidInstallments > history.length).
      // 2) Clamp any existing entries with paidAt in the future down to today.
      // 3) Link/create transactions for entries without `transactionId` so the
      //    saldo do account reflete os pagamentos históricos.
      const debtsToBackfill = dbts.filter(
        (d) => !backfilledRef.current.has(d.id),
      );
      if (debtsToBackfill.length === 0) return;
      // Mark immediately to prevent concurrent re-runs from overlapping snapshots.
      for (const d of debtsToBackfill) backfilledRef.current.add(d.id);

      (async () => {
        try {
          const nowMs = Date.now();
          const todayIso = new Date().toISOString();

          type TxOp =
            | { kind: 'flip'; txId: string }
            | { kind: 'create'; txId: string; data: Record<string, unknown> };
          const debtUpdates: Array<{
            debtId: string;
            newHistory: DebtPayment[];
            txOps: TxOp[];
          }> = [];

          for (const debt of debtsToBackfill) {
            const paid = debt.paidInstallments ?? 0;
            let history = debt.paymentHistory ?? [];
            const due = debt.dueDate ? safeParse(debt.dueDate) : null;
            let mutated = false;

            // 1) Clamp future-dated paidAt to today
            if (history.some((h) => new Date(h.paidAt).getTime() > nowMs)) {
              history = history.map((h) =>
                new Date(h.paidAt).getTime() > nowMs
                  ? { ...h, paidAt: todayIso }
                  : h,
              );
              mutated = true;
            }

            // 2) Pre-fetch card transactions for linking (only for card-backed debts)
            const cardTxByInst = new Map<
              number,
              { id: string; status: string }
            >();
            if (debt.cardId) {
              const snap = await getDocs(
                query(
                  collection(
                    db,
                    'users',
                    user.id,
                    'accounts',
                    accountType,
                    'transactions',
                  ),
                  where('cardId', '==', debt.cardId),
                ),
              );
              for (const d of snap.docs) {
                const data = d.data() as any;
                if (
                  data.installments?.total === debt.installments &&
                  data.installments?.current >= 1 &&
                  data.installments?.current <= debt.installments
                ) {
                  const existing = cardTxByInst.get(data.installments.current);
                  // Prefer a_pagar over already-pago when multiple match
                  if (
                    !existing ||
                    (data.status === 'a_pagar' &&
                      existing.status !== 'a_pagar')
                  ) {
                    cardTxByInst.set(data.installments.current, {
                      id: d.id,
                      status: data.status,
                    });
                  }
                }
              }
            }

            const txOps: TxOp[] = [];
            // Track transactionIds we just synthesized to avoid duplicating
            // when the same loop iterates over the same installment twice.
            const linkOrCreate = (
              installmentNumber: number,
              amount: number,
              paidAt: string,
            ): { transactionId: string; createdTransaction: boolean } => {
              const linked = cardTxByInst.get(installmentNumber);
              if (linked) {
                if (linked.status === 'a_pagar') {
                  txOps.push({ kind: 'flip', txId: linked.id });
                  // Mark as flipped so subsequent iterations don't re-flip
                  cardTxByInst.set(installmentNumber, {
                    id: linked.id,
                    status: 'pago',
                  });
                }
                return {
                  transactionId: linked.id,
                  createdTransaction: false,
                };
              }
              const newTxRef = doc(
                collection(
                  db,
                  'users',
                  user.id,
                  'accounts',
                  accountType,
                  'transactions',
                ),
              );
              const paidYmd = format(new Date(paidAt), 'yyyy-MM-dd');
              txOps.push({
                kind: 'create',
                txId: newTxRef.id,
                data: {
                  description: `${debt.description} — Parcela ${installmentNumber}/${debt.installments}`,
                  amount,
                  category: 'outros',
                  type: 'expense',
                  status: 'pago',
                  date: paidYmd,
                  createdAt: paidAt,
                },
              });
              return {
                transactionId: newTxRef.id,
                createdTransaction: true,
              };
            };

            // 3) Existing entries without transactionId → link or create
            history = history.map((e) => {
              if (e.transactionId) return e;
              mutated = true;
              const linkInfo = linkOrCreate(
                e.installmentNumber,
                e.amount ?? debt.installmentAmount,
                e.paidAt,
              );
              return { ...e, ...linkInfo };
            });

            // 4) Missing entries (paid > history.length) → create entries
            const existingNumbers = new Set(
              history.map((h) => h.installmentNumber),
            );
            for (let n = 1; n <= paid; n++) {
              if (existingNumbers.has(n)) continue;
              mutated = true;
              let paidAtDate = due ? addMonths(due, n - 1) : new Date();
              if (paidAtDate.getTime() > nowMs) paidAtDate = new Date();
              const paidIso = paidAtDate.toISOString();
              const linkInfo = linkOrCreate(
                n,
                debt.installmentAmount,
                paidIso,
              );
              history.push({
                installmentNumber: n,
                paidAt: paidIso,
                amount: debt.installmentAmount,
                ...linkInfo,
              });
            }

            history.sort((a, b) => a.installmentNumber - b.installmentNumber);

            if (mutated) {
              debtUpdates.push({
                debtId: debt.id,
                newHistory: history,
                txOps,
              });
            }
          }

          if (debtUpdates.length === 0) return;

          // Commit in chunks of <= 450 ops to stay under Firestore's 500 limit
          let batch = writeBatch(db);
          let opCount = 0;
          const flush = async () => {
            if (opCount > 0) {
              await batch.commit();
              batch = writeBatch(db);
              opCount = 0;
            }
          };
          for (const u of debtUpdates) {
            const debtRef = doc(
              db,
              'users',
              user.id,
              'accounts',
              accountType,
              'debts',
              u.debtId,
            );
            batch.update(debtRef, { paymentHistory: u.newHistory });
            opCount += 1;
            for (const op of u.txOps) {
              const txRef = doc(
                db,
                'users',
                user.id,
                'accounts',
                accountType,
                'transactions',
                op.txId,
              );
              if (op.kind === 'flip') {
                batch.update(txRef, { status: 'pago' });
              } else {
                batch.set(txRef, op.data);
              }
              opCount += 1;
              if (opCount >= 450) await flush();
            }
            if (opCount >= 450) await flush();
          }
          await flush();
          // Bonus: fresh transaction snapshot (we touched many)
          queryClient.invalidateQueries({
            queryKey: ['transactions', user.id, accountType],
          });
        } catch (err) {
          console.error('[useDebts] backfill failed:', err);
          // Allow retry on next mount
          for (const d of debtsToBackfill) backfilledRef.current.delete(d.id);
        }
      })();
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
    mutationFn: async ({
      id,
      mode = 'soft',
    }: {
      id: string;
      mode?: 'soft' | 'revert';
    }) => {
      if (!user) throw new Error('User not authenticated');

      if (mode === 'soft') {
        return deleteDoc(
          doc(db, 'users', user.id, 'accounts', accountType, 'debts', id),
        );
      }

      // 'revert': also undo each paymentHistory entry's transaction effect
      const cached = queryClient.getQueryData<Debt[]>(queryKey) || [];
      const debt = cached.find((d) => d.id === id);
      const history = debt?.paymentHistory ?? [];

      let batch = writeBatch(db);
      let count = 0;
      const flush = async () => {
        if (count > 0) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      };

      for (const entry of history) {
        if (!entry.transactionId) continue;
        const txRef = doc(
          db,
          'users',
          user.id,
          'accounts',
          accountType,
          'transactions',
          entry.transactionId,
        );
        if (entry.createdTransaction) {
          batch.delete(txRef);
        } else {
          batch.update(txRef, { status: 'a_pagar' });
        }
        count += 1;
        if (count >= 450) await flush();
      }

      const debtRef = doc(
        db,
        'users',
        user.id,
        'accounts',
        accountType,
        'debts',
        id,
      );
      batch.delete(debtRef);
      count += 1;
      await flush();
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousDebts = queryClient.getQueryData<Debt[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: Debt[] = []) =>
        old.filter((d) => d.id !== id),
      );

      return { previousDebts };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDebts) {
        queryClient.setQueryData(queryKey, context.previousDebts);
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey });
      if (vars.mode === 'revert') {
        queryClient.invalidateQueries({
          queryKey: ['transactions', user?.id, accountType],
        });
      }
    },
  });

  /**
   * Find unpaid card-installment transactions for the given debt. Returns a
   * map of installment number → transaction document id. Empty map if the
   * debt has no card or no matching transactions exist (standalone debt).
   */
  const fetchLinkedCardTxByInstallment = async (
    debt: Debt,
  ): Promise<Map<number, string>> => {
    const out = new Map<number, string>();
    if (!user || !debt.cardId) return out;
    const snap = await getDocs(
      query(
        collection(
          db,
          'users',
          user.id,
          'accounts',
          accountType,
          'transactions',
        ),
        where('cardId', '==', debt.cardId),
      ),
    );
    for (const d of snap.docs) {
      const data = d.data() as any;
      if (
        data.status === 'a_pagar' &&
        data.installments?.current >= 1 &&
        data.installments?.current <= debt.installments &&
        data.installments?.total === debt.installments
      ) {
        out.set(data.installments.current, d.id);
      }
    }
    return out;
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({
      queryKey: ['transactions', user?.id, accountType],
    });
  };

  const incrementInstallment = async (debt: Debt) => {
    if (!user) throw new Error('User not authenticated');
    const currentPaid = debt.paidInstallments || 0;
    if (currentPaid >= debt.installments) return;
    const newPaid = currentPaid + 1;
    const newStatus: Debt['status'] =
      newPaid >= debt.installments ? 'pago' : 'a_pagar';

    const linkedByInst = await fetchLinkedCardTxByInstallment(debt);
    const linkedTxId = linkedByInst.get(newPaid);

    const batch = writeBatch(db);
    const debtRef = doc(
      db,
      'users',
      user.id,
      'accounts',
      accountType,
      'debts',
      debt.id,
    );
    const todayDate = new Date();
    const todayIso = todayDate.toISOString();
    const todayYmd = format(todayDate, 'yyyy-MM-dd');

    let transactionId: string;
    let createdTransaction = false;
    if (linkedTxId) {
      const txRef = doc(
        db,
        'users',
        user.id,
        'accounts',
        accountType,
        'transactions',
        linkedTxId,
      );
      batch.update(txRef, { status: 'pago' });
      transactionId = linkedTxId;
    } else {
      const newTxRef = doc(
        collection(
          db,
          'users',
          user.id,
          'accounts',
          accountType,
          'transactions',
        ),
      );
      batch.set(newTxRef, {
        description: `${debt.description} — Parcela ${newPaid}/${debt.installments}`,
        amount: debt.installmentAmount,
        category: 'outros',
        type: 'expense',
        status: 'pago',
        date: todayYmd,
        createdAt: todayIso,
      });
      transactionId = newTxRef.id;
      createdTransaction = true;
    }

    const history = debt.paymentHistory ?? [];
    const newEntry: DebtPayment = {
      installmentNumber: newPaid,
      paidAt: todayIso,
      amount: debt.installmentAmount,
      transactionId,
      createdTransaction,
    };
    batch.update(debtRef, {
      paidInstallments: newPaid,
      status: newStatus,
      paymentHistory: [...history, newEntry],
    });

    await batch.commit();
    invalidateAll();
  };

  const settleDebt = async (debt: Debt) => {
    if (!user) throw new Error('User not authenticated');
    const currentPaid = debt.paidInstallments || 0;
    if (currentPaid >= debt.installments) return;

    const linkedByInst = await fetchLinkedCardTxByInstallment(debt);

    const batch = writeBatch(db);
    const debtRef = doc(
      db,
      'users',
      user.id,
      'accounts',
      accountType,
      'debts',
      debt.id,
    );
    const todayDate = new Date();
    const todayIso = todayDate.toISOString();
    const todayYmd = format(todayDate, 'yyyy-MM-dd');

    const newEntries: DebtPayment[] = [];
    for (let n = currentPaid + 1; n <= debt.installments; n++) {
      let transactionId: string;
      let createdTransaction = false;
      const linkedTxId = linkedByInst.get(n);
      if (linkedTxId) {
        const txRef = doc(
          db,
          'users',
          user.id,
          'accounts',
          accountType,
          'transactions',
          linkedTxId,
        );
        batch.update(txRef, { status: 'pago' });
        transactionId = linkedTxId;
      } else {
        const newTxRef = doc(
          collection(
            db,
            'users',
            user.id,
            'accounts',
            accountType,
            'transactions',
          ),
        );
        batch.set(newTxRef, {
          description: `${debt.description} — Parcela ${n}/${debt.installments}`,
          amount: debt.installmentAmount,
          category: 'outros',
          type: 'expense',
          status: 'pago',
          date: todayYmd,
          createdAt: todayIso,
        });
        transactionId = newTxRef.id;
        createdTransaction = true;
      }
      newEntries.push({
        installmentNumber: n,
        paidAt: todayIso,
        amount: debt.installmentAmount,
        transactionId,
        createdTransaction,
      });
    }

    const history = debt.paymentHistory ?? [];
    batch.update(debtRef, {
      paidInstallments: debt.installments,
      status: 'pago',
      paymentHistory: [...history, ...newEntries],
    });

    await batch.commit();
    invalidateAll();
  };

  const unmarkLastInstallment = async (
    debt: Debt,
    mode: 'soft' | 'revert' = 'revert',
  ) => {
    if (!user) throw new Error('User not authenticated');
    const currentPaid = debt.paidInstallments || 0;
    if (currentPaid <= 0) return;
    const newPaid = currentPaid - 1;
    const history = debt.paymentHistory ?? [];
    const idx = [...history]
      .map((p, i) => ({ p, i }))
      .reverse()
      .find((x) => x.p.installmentNumber === currentPaid)?.i;
    const lastEntry = idx !== undefined ? history[idx] : null;
    const newHistory =
      idx !== undefined
        ? [...history.slice(0, idx), ...history.slice(idx + 1)]
        : history;

    const batch = writeBatch(db);
    const debtRef = doc(
      db,
      'users',
      user.id,
      'accounts',
      accountType,
      'debts',
      debt.id,
    );

    if (mode === 'revert' && lastEntry?.transactionId) {
      const txRef = doc(
        db,
        'users',
        user.id,
        'accounts',
        accountType,
        'transactions',
        lastEntry.transactionId,
      );
      if (lastEntry.createdTransaction) {
        batch.delete(txRef);
      } else {
        batch.update(txRef, { status: 'a_pagar' });
      }
    }

    batch.update(debtRef, {
      paidInstallments: newPaid,
      status: 'a_pagar',
      paymentHistory: newHistory,
    });

    await batch.commit();
    invalidateAll();
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
