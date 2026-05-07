import { useEffect, useMemo, useRef } from 'react';
import { Debt, DebtFormValues, DebtPayment } from '../types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

interface DebtRow {
  id: string;
  description: string;
  total_amount: number | string;
  installments: number;
  installment_amount: number | string;
  paid_installments: number;
  status: 'a_pagar' | 'pago';
  due_date: string;
  card_id: string | null;
  created_at: string;
  payment_history: DebtPayment[] | null;
}

function rowToDebt(row: DebtRow): Debt {
  const num = (v: number | string) =>
    typeof v === 'string' ? Number(v) : v;
  return {
    id: row.id,
    description: row.description,
    totalAmount: num(row.total_amount),
    installments: row.installments,
    installmentAmount: num(row.installment_amount),
    paidInstallments: row.paid_installments,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    cardId: row.card_id ?? undefined,
    paymentHistory: row.payment_history ?? [],
  };
}

function formToRow(data: Partial<DebtFormValues>) {
  const out: Record<string, unknown> = {};
  if (data.description !== undefined) out.description = data.description;
  if (data.totalAmount !== undefined) out.total_amount = data.totalAmount;
  if (data.installments !== undefined) out.installments = data.installments;
  if (data.installmentAmount !== undefined)
    out.installment_amount = data.installmentAmount;
  if (data.paidInstallments !== undefined)
    out.paid_installments = data.paidInstallments;
  if (data.status !== undefined) out.status = data.status;
  if (data.dueDate !== undefined) out.due_date = data.dueDate;
  if (data.cardId !== undefined) out.card_id = data.cardId ?? null;
  return out;
}

/**
 * For card-linked debts, build a map of installment number → unpaid
 * transaction id, so we can flip them a_pagar→pago when a parcel is paid.
 */
async function fetchLinkedCardTxByInstallment(
  cardId: string,
  totalInstallments: number,
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  const { data, error } = await supabase
    .from('transactions')
    .select('id, status, installments_current, installments_total')
    .eq('card_id', cardId)
    .eq('status', 'a_pagar');
  if (error || !data) return out;
  for (const row of data) {
    const cur = row.installments_current as number | null;
    const tot = row.installments_total as number | null;
    if (
      cur !== null &&
      cur >= 1 &&
      cur <= totalInstallments &&
      tot === totalInstallments
    ) {
      out.set(cur, row.id as string);
    }
  }
  return out;
}

type DeleteMode = 'soft' | 'revert';
type UnmarkMode = 'soft' | 'revert';

export function useDebts() {
  const { user } = useAuth();
  const { accountId } = useAccount();
  const queryClient = useQueryClient();
  const queryKey = ['debts', user?.id, accountId];

  const { data: debts = [], isPending } = useQuery<Debt[]>({
    queryKey,
    enabled: !!user && !!accountId,
    staleTime: 1000 * 60,
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('debts')
        .select(
          'id, description, total_amount, installments, installment_amount, paid_installments, status, due_date, card_id, created_at, payment_history',
        )
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as DebtRow[]).map(rowToDebt);
    },
  });

  useEffect(() => {
    if (!user || !accountId) return;
    const channel = supabase
      .channel(`debts:${accountId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debts',
          filter: `account_id=eq.${accountId}`,
        },
        () => queryClient.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accountId, queryClient]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['transactions', user?.id, accountId] });
  };

  const addMutation = useMutation({
    mutationFn: async (data: DebtFormValues) => {
      if (!accountId) throw new Error('Account not ready');
      const { error } = await supabase.from('debts').insert({
        account_id: accountId,
        ...formToRow(data),
        paid_installments: data.paidInstallments ?? 0,
      });
      if (error) throw error;
    },
    onSettled: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<DebtFormValues>;
    }) => {
      const { error } = await supabase
        .from('debts')
        .update(formToRow(data))
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Debt[]>(queryKey);
      queryClient.setQueryData(queryKey, (old: Debt[] = []) =>
        old.map((d) => (d.id === id ? { ...d, ...data } : d)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: invalidateAll,
  });

  /**
   * Pay one more installment.
   *  - card-linked debts: flip the matching a_pagar transaction to pago.
   *  - standalone debts: insert a new expense / pago transaction (categoria
   *    "outros") so the account balance reflects the outflow.
   * Either way, log the operation in payment_history with transactionId so
   * unmarkLastInstallment can undo it.
   */
  const incrementInstallment = async (debt: Debt) => {
    if (!user || !accountId) throw new Error('User not authenticated');
    const currentPaid = debt.paidInstallments ?? 0;
    if (currentPaid >= debt.installments) return;
    const newPaid = currentPaid + 1;
    const newStatus: Debt['status'] =
      newPaid >= debt.installments ? 'pago' : 'a_pagar';

    const todayDate = new Date();
    const todayIso = todayDate.toISOString();
    const todayYmd = format(todayDate, 'yyyy-MM-dd');

    let transactionId: string | undefined;
    let createdTransaction = false;

    if (debt.cardId) {
      const linked = await fetchLinkedCardTxByInstallment(
        debt.cardId,
        debt.installments,
      );
      const linkedTxId = linked.get(newPaid);
      if (linkedTxId) {
        const { error: txErr } = await supabase
          .from('transactions')
          .update({ status: 'pago' })
          .eq('id', linkedTxId);
        if (txErr) throw txErr;
        transactionId = linkedTxId;
      }
    }

    if (!transactionId) {
      const { data: newTx, error: txErr } = await supabase
        .from('transactions')
        .insert({
          account_id: accountId,
          description: `${debt.description} — Parcela ${newPaid}/${debt.installments}`,
          amount: debt.installmentAmount,
          category: 'outros',
          type: 'expense',
          status: 'pago',
          date: todayYmd,
        })
        .select('id')
        .single();
      if (txErr) throw txErr;
      transactionId = (newTx as { id: string }).id;
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

    const { error: debtErr } = await supabase
      .from('debts')
      .update({
        paid_installments: newPaid,
        status: newStatus,
        payment_history: [...history, newEntry],
      })
      .eq('id', debt.id);
    if (debtErr) throw debtErr;

    invalidateAll();
  };

  /**
   * Mark all remaining installments as paid in a single operation, doing the
   * same flip-or-create-transaction dance for each.
   */
  const settleDebt = async (debt: Debt) => {
    if (!user || !accountId) throw new Error('User not authenticated');
    const currentPaid = debt.paidInstallments ?? 0;
    if (currentPaid >= debt.installments) return;

    const todayDate = new Date();
    const todayIso = todayDate.toISOString();
    const todayYmd = format(todayDate, 'yyyy-MM-dd');

    const linkedByInst = debt.cardId
      ? await fetchLinkedCardTxByInstallment(debt.cardId, debt.installments)
      : new Map<number, string>();

    const newEntries: DebtPayment[] = [];
    const toInsert: Array<{
      account_id: string;
      description: string;
      amount: number;
      category: string;
      type: 'expense';
      status: 'pago';
      date: string;
    }> = [];
    const flipIds: string[] = [];
    // We can't write transactions for to-create entries until we know their
    // ids, so collect what to flip / insert and then assemble entries.
    const positions: Array<{
      installmentNumber: number;
      kind: 'flip' | 'create';
      flipId?: string;
      insertIndex?: number;
    }> = [];

    for (let n = currentPaid + 1; n <= debt.installments; n++) {
      const linkedId = linkedByInst.get(n);
      if (linkedId) {
        flipIds.push(linkedId);
        positions.push({
          installmentNumber: n,
          kind: 'flip',
          flipId: linkedId,
        });
      } else {
        positions.push({
          installmentNumber: n,
          kind: 'create',
          insertIndex: toInsert.length,
        });
        toInsert.push({
          account_id: accountId,
          description: `${debt.description} — Parcela ${n}/${debt.installments}`,
          amount: debt.installmentAmount,
          category: 'outros',
          type: 'expense',
          status: 'pago',
          date: todayYmd,
        });
      }
    }

    if (flipIds.length > 0) {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'pago' })
        .in('id', flipIds);
      if (error) throw error;
    }

    let insertedIds: string[] = [];
    if (toInsert.length > 0) {
      const { data: inserted, error } = await supabase
        .from('transactions')
        .insert(toInsert)
        .select('id');
      if (error) throw error;
      insertedIds = (inserted as Array<{ id: string }>).map((r) => r.id);
    }

    for (const p of positions) {
      const transactionId =
        p.kind === 'flip' ? p.flipId! : insertedIds[p.insertIndex!];
      newEntries.push({
        installmentNumber: p.installmentNumber,
        paidAt: todayIso,
        amount: debt.installmentAmount,
        transactionId,
        createdTransaction: p.kind === 'create',
      });
    }

    const history = debt.paymentHistory ?? [];
    const { error: debtErr } = await supabase
      .from('debts')
      .update({
        paid_installments: debt.installments,
        status: 'pago',
        payment_history: [...history, ...newEntries],
      })
      .eq('id', debt.id);
    if (debtErr) throw debtErr;

    invalidateAll();
  };

  /**
   * Undo the last paid installment.
   * mode 'revert' (default): also delete the synthetic transaction or flip
   *   the card-linked one back to a_pagar, removing it from balance.
   * mode 'soft': leave the transaction intact (user wants to keep the
   *   balance change but stop tracking that parcel as paid).
   */
  const unmarkLastInstallment = async (
    debt: Debt,
    mode: UnmarkMode = 'revert',
  ) => {
    if (!user) throw new Error('User not authenticated');
    const currentPaid = debt.paidInstallments ?? 0;
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

    if (mode === 'revert' && lastEntry?.transactionId) {
      if (lastEntry.createdTransaction) {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', lastEntry.transactionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transactions')
          .update({ status: 'a_pagar' })
          .eq('id', lastEntry.transactionId);
        if (error) throw error;
      }
    }

    const { error: debtErr } = await supabase
      .from('debts')
      .update({
        paid_installments: newPaid,
        status: 'a_pagar',
        payment_history: newHistory,
      })
      .eq('id', debt.id);
    if (debtErr) throw debtErr;

    invalidateAll();
  };

  /**
   * Delete a debt.
   * mode 'soft' (default for callers that don't care): row goes away, related
   *   transactions stay (saldo intacto).
   * mode 'revert': also delete synthetic transactions and flip card-linked
   *   ones back to a_pagar. Use when the user explicitly chose "reverter saldo".
   */
  const deleteMutation = useMutation({
    mutationFn: async (
      input:
        | string
        | { id: string; mode: DeleteMode },
    ) => {
      const id = typeof input === 'string' ? input : input.id;
      const mode: DeleteMode =
        typeof input === 'string' ? 'soft' : input.mode;

      if (mode === 'revert') {
        const debt = debts.find((d) => d.id === id);
        const history = debt?.paymentHistory ?? [];
        const toDelete: string[] = [];
        const toFlip: string[] = [];
        for (const entry of history) {
          if (!entry.transactionId) continue;
          if (entry.createdTransaction) toDelete.push(entry.transactionId);
          else toFlip.push(entry.transactionId);
        }
        if (toDelete.length > 0) {
          const { error } = await supabase
            .from('transactions')
            .delete()
            .in('id', toDelete);
          if (error) throw error;
        }
        if (toFlip.length > 0) {
          const { error } = await supabase
            .from('transactions')
            .update({ status: 'a_pagar' })
            .in('id', toFlip);
          if (error) throw error;
        }
      }

      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (input) => {
      const id = typeof input === 'string' ? input : input.id;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Debt[]>(queryKey);
      queryClient.setQueryData(queryKey, (old: Debt[] = []) =>
        old.filter((d) => d.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: invalidateAll,
  });

  // ── silent backfill for legacy debts ─────────────────────────────────────
  // For each debt with paidInstallments > history.length, top up the history
  // with synthetic entries (no transaction link) so the new "Parcelas pagas"
  // tab and undo flow have something to work with. Runs once per mount per
  // missing-history debt.
  const backfilledRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!debts || debts.length === 0) return;
    const todo = debts.filter((d) => {
      if (backfilledRef.current.has(d.id)) return false;
      const paid = d.paidInstallments ?? 0;
      const histLen = d.paymentHistory?.length ?? 0;
      return paid > histLen;
    });
    if (todo.length === 0) return;
    (async () => {
      for (const d of todo) {
        backfilledRef.current.add(d.id);
        const paid = d.paidInstallments ?? 0;
        const existing = d.paymentHistory ?? [];
        const known = new Set(existing.map((e) => e.installmentNumber));
        // Clamp paidAt to never land in the future (commit's heuristic).
        const dueDate = (() => {
          try {
            return /^\d{4}-\d{2}-\d{2}$/.test(d.dueDate)
              ? new Date(`${d.dueDate}T00:00:00`)
              : parseISO(d.dueDate);
          } catch {
            return new Date();
          }
        })();
        const today = new Date();
        const filled: DebtPayment[] = [];
        for (let n = 1; n <= paid; n++) {
          if (known.has(n)) continue;
          const monthOffset = n - 1;
          const candidate = new Date(dueDate);
          candidate.setMonth(candidate.getMonth() + monthOffset);
          const paidAt = candidate > today ? today : candidate;
          filled.push({
            installmentNumber: n,
            paidAt: paidAt.toISOString(),
            amount: d.installmentAmount,
          });
        }
        if (filled.length === 0) continue;
        const merged = [...existing, ...filled].sort(
          (a, b) => a.installmentNumber - b.installmentNumber,
        );
        await supabase
          .from('debts')
          .update({ payment_history: merged })
          .eq('id', d.id);
      }
      invalidateAll();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debts]);

  const summary = useMemo(() => {
    return debts.reduce(
      (acc, d) => {
        const paidAmount = (d.paidInstallments || 0) * d.installmentAmount;
        const remainingAmount = d.totalAmount - paidAmount;
        acc.total += d.totalAmount;
        acc.paid += paidAmount;
        acc.remaining += remainingAmount;
        return acc;
      },
      { total: 0, paid: 0, remaining: 0 },
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
