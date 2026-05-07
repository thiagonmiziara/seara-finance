import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { RecurringBill, RecurringBillFormValues } from '@/types';

interface BillRow {
  id: string;
  description: string;
  amount: number | string;
  category: string;
  type: 'income' | 'expense';
  due_day: number;
  is_active: boolean;
  created_at: string;
}

function rowToBill(row: BillRow): RecurringBill {
  return {
    id: row.id,
    description: row.description,
    amount: typeof row.amount === 'string' ? Number(row.amount) : row.amount,
    category: row.category,
    type: row.type,
    dueDay: row.due_day,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function formToRow(data: Partial<RecurringBillFormValues>) {
  const out: Record<string, unknown> = {};
  if (data.description !== undefined) out.description = data.description;
  if (data.amount !== undefined) out.amount = data.amount;
  if (data.category !== undefined) out.category = data.category;
  if (data.type !== undefined) out.type = data.type;
  if (data.dueDay !== undefined) out.due_day = data.dueDay;
  if (data.isActive !== undefined) out.is_active = data.isActive;
  return out;
}

export function useRecurringBills() {
  const { user } = useAuth();
  const { accountId } = useAccount();
  const queryClient = useQueryClient();
  const queryKey = ['recurringBills', user?.id, accountId];

  const { data: recurringBills = [], isPending } = useQuery<RecurringBill[]>({
    queryKey,
    enabled: !!user && !!accountId,
    staleTime: 1000 * 60,
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('recurring_bills')
        .select(
          'id, description, amount, category, type, due_day, is_active, created_at',
        )
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as BillRow[]).map(rowToBill);
    },
  });

  useEffect(() => {
    if (!user || !accountId) return;
    const channel = supabase
      .channel(`recurring_bills:${accountId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recurring_bills',
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

  const addMutation = useMutation({
    mutationFn: async (data: RecurringBillFormValues) => {
      if (!accountId) throw new Error('Account not ready');
      const { error } = await supabase
        .from('recurring_bills')
        .insert({ account_id: accountId, ...formToRow(data) });
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<RecurringBillFormValues>;
    }) => {
      const { error } = await supabase
        .from('recurring_bills')
        .update(formToRow(data))
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RecurringBill[]>(queryKey);
      queryClient.setQueryData(queryKey, (old: RecurringBill[] = []) =>
        old.map((b) => (b.id === id ? { ...b, ...data } : b)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_bills')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RecurringBill[]>(queryKey);
      queryClient.setQueryData(queryKey, (old: RecurringBill[] = []) =>
        old.filter((b) => b.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const toggleActive = (bill: RecurringBill) =>
    updateMutation.mutateAsync({
      id: bill.id,
      data: { isActive: !bill.isActive },
    });

  return {
    recurringBills,
    isLoading: isPending,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    addBill: addMutation.mutateAsync,
    updateBill: updateMutation.mutateAsync,
    removeBill: deleteMutation.mutateAsync,
    toggleActive,
  };
}
