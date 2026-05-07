import { useEffect, useMemo } from 'react';
import { Transaction, TransactionFormValues } from '../types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { useCategories } from './useCategories';
import { CATEGORIES as STATIC_CATEGORIES } from '@/lib/categories';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DateRange {
  from: Date;
  to: Date;
}

interface TransactionRow {
  id: string;
  description: string;
  amount: number | string;
  category: string;
  type: 'income' | 'expense';
  status: 'pago' | 'a_pagar' | 'recebido' | 'a_receber';
  date: string;
  card_id: string | null;
  installments_current: number | null;
  installments_total: number | null;
  recurring_bill_id: string | null;
  recurring_year_month: string | null;
  created_at: string;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    description: row.description,
    amount: typeof row.amount === 'string' ? Number(row.amount) : row.amount,
    category: row.category,
    type: row.type,
    status: row.status,
    date: row.date,
    createdAt: row.created_at,
    cardId: row.card_id ?? undefined,
    installments:
      row.installments_current && row.installments_total
        ? {
            current: row.installments_current,
            total: row.installments_total,
          }
        : undefined,
    recurringBillId: row.recurring_bill_id ?? undefined,
    recurringYearMonth: row.recurring_year_month ?? undefined,
  };
}

export function useFinance(filter?: DateRange) {
  const { user } = useAuth();
  const { accountId } = useAccount();
  const { categories } = useCategories();
  const queryClient = useQueryClient();
  const queryKey = ['transactions', user?.id, accountId];

  const { data: transactions = [], isPending } = useQuery<Transaction[]>({
    queryKey,
    enabled: !!user && !!accountId,
    staleTime: 1000 * 60,
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select(
          'id, description, amount, category, type, status, date, card_id, installments_current, installments_total, recurring_bill_id, recurring_year_month, created_at',
        )
        .eq('account_id', accountId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as TransactionRow[]).map(rowToTransaction);
    },
  });

  // Realtime sync
  useEffect(() => {
    if (!user || !accountId) return;
    const channel = supabase
      .channel(`transactions:${accountId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `account_id=eq.${accountId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accountId, queryClient]);

  // ── add (with optional installment expansion for credit cards) ──────────
  const addMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      if (!user || !accountId) throw new Error('User not authenticated');
      const { cardId, installmentsTotal, ...rest } = data;

      if (data.type === 'expense' && cardId) {
        const { data: card, error: cardErr } = await supabase
          .from('cards')
          .select('closing_day, due_day, name')
          .eq('id', cardId)
          .single();
        if (cardErr || !card) throw cardErr ?? new Error('Card not found');

        const purchaseDate = new Date(`${data.date}T00:00:00`);
        const totalInst = installmentsTotal || 1;
        const baseAmount = Number((data.amount / totalInst).toFixed(2));

        const rows = [];
        for (let i = 1; i <= totalInst; i++) {
          let invoiceMonth = purchaseDate.getMonth();
          const invoiceYear = purchaseDate.getFullYear();
          if (purchaseDate.getDate() >= card.closing_day) invoiceMonth += 1;
          invoiceMonth += i - 1;
          const dueDate = new Date(invoiceYear, invoiceMonth, card.due_day);
          rows.push({
            account_id: accountId,
            description: rest.description,
            amount: baseAmount,
            category: rest.category,
            type: rest.type,
            status: 'a_pagar' as const,
            date: dueDate.toISOString().split('T')[0],
            card_id: cardId,
            installments_current: i,
            installments_total: totalInst,
          });
        }

        const firstDueDate = new Date(rows[0].date);
        const { error: txErr } = await supabase
          .from('transactions')
          .insert(rows);
        if (txErr) throw txErr;

        const { error: debtErr } = await supabase.from('debts').insert({
          account_id: accountId,
          description: `${rest.description} (${card.name} - ${totalInst}x)`,
          total_amount: data.amount,
          installments: totalInst,
          installment_amount: baseAmount,
          paid_installments: 0,
          status: 'a_pagar',
          due_date: firstDueDate.toISOString().split('T')[0],
          card_id: cardId,
        });
        if (debtErr) throw debtErr;
        return;
      }

      // Normal transaction
      const { error } = await supabase.from('transactions').insert({
        account_id: accountId,
        description: rest.description,
        amount: data.amount,
        category: rest.category,
        type: rest.type,
        status: rest.status,
        date: rest.date,
      });
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });

  const addTransactionsBatchMutation = useMutation({
    mutationFn: async (transactionsData: TransactionFormValues[]) => {
      if (!user || !accountId) throw new Error('User not authenticated');
      if (transactionsData.length === 0) return;
      const rows = transactionsData.map((t) => ({
        account_id: accountId,
        description: t.description,
        amount: t.amount,
        category: t.category,
        type: t.type,
        status: t.status,
        date: t.date,
      }));
      // chunk in 500 to respect any payload limits
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await supabase.from('transactions').insert(chunk);
        if (error) throw error;
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const addTransferMutation = useMutation({
    mutationFn: async ({
      sourceData,
      destinationData,
      destinationAccountType,
    }: {
      sourceData: TransactionFormValues;
      destinationData: TransactionFormValues;
      destinationAccountType: string;
    }) => {
      if (!user || !accountId) throw new Error('User not authenticated');

      // Look up (or create) the destination account by its type.
      let { data: destAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('type', destinationAccountType)
        .maybeSingle();
      if (!destAccount) {
        const { data: created, error: createErr } = await supabase
          .from('accounts')
          .insert({ type: destinationAccountType })
          .select('id')
          .single();
        if (createErr) throw createErr;
        destAccount = created;
      }

      const { error } = await supabase.from('transactions').insert([
        {
          account_id: accountId,
          description: sourceData.description,
          amount: sourceData.amount,
          category: sourceData.category,
          type: sourceData.type,
          status: sourceData.status,
          date: sourceData.date,
        },
        {
          account_id: destAccount.id,
          description: destinationData.description,
          amount: destinationData.amount,
          category: destinationData.category,
          type: destinationData.type,
          status: destinationData.status,
          date: destinationData.date,
        },
      ]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Transaction[]>(queryKey);
      queryClient.setQueryData(queryKey, (old: Transaction[] = []) =>
        old.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  /**
   * Flip the status of a single transaction (pago↔a_pagar / recebido↔a_receber).
   * Used by per-row "marcar como pago/recebido" buttons in TransactionTable
   * and the recurring bills summary badge.
   */
  const updateTransactionStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'pago' | 'a_pagar' | 'recebido' | 'a_receber';
    }) => {
      const { error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Transaction[]>(queryKey);
      queryClient.setQueryData(queryKey, (old: Transaction[] = []) =>
        old.map((t) => (t.id === id ? { ...t, status } : t)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const payInvoiceMonthMutation = useMutation({
    mutationFn: async ({
      transactionIds,
      debtUpdates,
    }: {
      cardId: string;
      yearMonth: string;
      transactionIds: string[];
      debtUpdates: Array<{
        id: string;
        paidInstallments: number;
        status: string;
      }>;
    }) => {
      if (transactionIds.length === 0 && debtUpdates.length === 0) return;
      if (transactionIds.length > 0) {
        const { error } = await supabase
          .from('transactions')
          .update({ status: 'pago' })
          .in('id', transactionIds);
        if (error) throw error;
      }
      for (const upd of debtUpdates) {
        const { error } = await supabase
          .from('debts')
          .update({
            paid_installments: upd.paidInstallments,
            status: upd.status,
          })
          .eq('id', upd.id);
        if (error) throw error;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });

  // ── filtering / summary identical to the original behavior ───────────────
  const parseTransactionDate = (value: string) => {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`);
    }
    return parseISO(value);
  };

  const dateFilteredTransactions = useMemo(() => {
    if (!filter) return transactions;
    return transactions.filter((t) => {
      const isPending = t.status === 'a_pagar' || t.status === 'a_receber';
      let txDate: Date | null = null;
      try {
        if (isPending) {
          if (t.cardId) {
            const isFirst = !t.installments || t.installments.current === 1;
            txDate = isFirst
              ? t.createdAt
                ? parseTransactionDate(t.createdAt)
                : null
              : t.date
                ? parseTransactionDate(t.date)
                : null;
          } else {
            txDate = t.createdAt ? parseTransactionDate(t.createdAt) : null;
          }
        } else {
          txDate = t.date ? parseTransactionDate(t.date) : null;
        }
      } catch {
        txDate = null;
      }
      if (!txDate) return false;
      return isWithinInterval(txDate, {
        start: startOfDay(filter.from),
        end: endOfDay(filter.to),
      });
    });
  }, [transactions, filter]);

  const summary = dateFilteredTransactions.reduce(
    (acc, t) => {
      // balance only reflects realized transactions; income/expense show
      // committed totals so projections (a_pagar/a_receber) still appear
      // in their respective KPIs.
      const isRealized = t.status === 'pago' || t.status === 'recebido';
      if (t.type === 'income') {
        acc.income += t.amount;
        if (isRealized) acc.balance += t.amount;
      } else {
        acc.expense += t.amount;
        if (isRealized) acc.balance -= t.amount;
      }
      return acc;
    },
    { income: 0, expense: 0, balance: 0 },
  );

  const exportToCSV = async (filteredTransactions?: Transaction[]) => {
    const dataToExport = filteredTransactions ?? dateFilteredTransactions;
    const headers = [
      'Descrição',
      'Valor',
      'Categoria',
      'Tipo',
      'Status',
      'Data',
      'Data do Cadastro',
    ];
    const rows = dataToExport.map((t) => {
      const txDate = parseTransactionDate(t.date);
      const createdAt = parseTransactionDate(t.createdAt);
      const foundCategory =
        categories.find((c) => c.value === t.category) ||
        STATIC_CATEGORIES.find((c) => c.value === t.category);
      const categoryLabel = foundCategory ? foundCategory.label : t.category;
      return [
        t.description,
        t.amount.toFixed(2).replace('.', ','),
        categoryLabel,
        t.type === 'income' ? 'Entrada' : 'Saída',
        t.status === 'pago'
          ? 'Pago'
          : t.status === 'a_pagar'
            ? 'A Pagar'
            : t.status === 'recebido'
              ? 'Recebido'
              : 'A Receber',
        txDate ? format(txDate, 'dd/MM/yyyy', { locale: ptBR }) : '',
        createdAt
          ? format(createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })
          : '',
      ];
    });

    const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;
    const csvContent = [
      headers.map(escapeCsv).join(';'),
      ...rows.map((e) => e.map(escapeCsv).join(';')),
    ].join('\n');

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'transacoes_saas_financas.csv',
          types: [
            {
              description: 'Arquivo CSV',
              accept: { 'text/csv': ['.csv'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write('﻿' + csvContent);
        await writable.close();
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Falha ao salvar:', err);
        } else {
          return;
        }
      }
    }

    const dataUri =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent('﻿' + csvContent);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = 'transacoes_saas_financas.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    transactions: dateFilteredTransactions,
    dashboardTransactions: dateFilteredTransactions,
    allTransactions: transactions,
    addTransaction: addMutation.mutateAsync,
    addTransactionsBatch: addTransactionsBatchMutation.mutateAsync,
    addTransfer: addTransferMutation.mutateAsync,
    removeTransaction: deleteMutation.mutateAsync,
    updateTransactionStatus: updateTransactionStatusMutation.mutateAsync,
    payInvoiceMonth: payInvoiceMonthMutation.mutateAsync,
    exportToCSV,
    summary,
    isAdding:
      addMutation.isPending ||
      addTransactionsBatchMutation.isPending ||
      addTransferMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPayingInvoice: payInvoiceMonthMutation.isPending,
    isInitialLoading: isPending && user !== null,
    isLoading:
      isPending ||
      addMutation.isPending ||
      addTransferMutation.isPending ||
      deleteMutation.isPending,
  };
}
