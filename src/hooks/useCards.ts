import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { CreditCard, CreditCardFormValues } from '@/types';

interface CardRow {
  id: string;
  name: string;
  brand: string | null;
  last_four: string | null;
  closing_day: number;
  due_day: number;
  limit_amount: number | string;
  limit_user_defined: number | string | null;
  color: string;
  created_at: string;
}

function rowToCard(row: CardRow): CreditCard {
  const num = (v: number | string) =>
    typeof v === 'string' ? Number(v) : v;
  return {
    id: row.id,
    name: row.name,
    brand: (row.brand as CreditCard['brand']) ?? undefined,
    lastFour: row.last_four ?? undefined,
    closingDay: row.closing_day,
    dueDay: row.due_day,
    limit: num(row.limit_amount),
    limit_user_defined:
      row.limit_user_defined !== null
        ? num(row.limit_user_defined)
        : undefined,
    color: row.color,
    createdAt: row.created_at,
  };
}

function formToRow(data: Partial<CreditCardFormValues>) {
  const out: Record<string, unknown> = {};
  if (data.name !== undefined) out.name = data.name;
  if (data.brand !== undefined) out.brand = data.brand ?? null;
  if (data.lastFour !== undefined) out.last_four = data.lastFour ?? null;
  if (data.closingDay !== undefined) out.closing_day = data.closingDay;
  if (data.dueDay !== undefined) out.due_day = data.dueDay;
  if (data.limit !== undefined) out.limit_amount = data.limit;
  if (data.limit_user_defined !== undefined)
    out.limit_user_defined = data.limit_user_defined ?? null;
  if (data.color !== undefined) out.color = data.color;
  return out;
}

export function useCards() {
  const { user } = useAuth();
  const { accountId } = useAccount();
  const queryClient = useQueryClient();

  const queryKey = ['cards', user?.id, accountId];

  const { data: cards = [], isPending } = useQuery<CreditCard[]>({
    queryKey,
    enabled: !!user && !!accountId,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('cards')
        .select(
          'id, name, brand, last_four, closing_day, due_day, limit_amount, limit_user_defined, color, created_at',
        )
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as CardRow[]).map(rowToCard);
    },
  });

  useEffect(() => {
    if (!user || !accountId) return;
    const channel = supabase
      .channel(`cards:${accountId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
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
    mutationFn: async (data: CreditCardFormValues) => {
      if (!accountId) throw new Error('Account not ready');
      const { error } = await supabase
        .from('cards')
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
      data: Partial<CreditCardFormValues>;
    }) => {
      const { error } = await supabase
        .from('cards')
        .update(formToRow(data))
        .eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      id,
      cardName,
      cascadeDelete,
    }: {
      id: string;
      cardName: string;
      cascadeDelete: boolean;
    }) => {
      if (!accountId) throw new Error('Account not ready');

      if (cascadeDelete) {
        // remove pending transactions tied to this card
        const { error: txErr } = await supabase
          .from('transactions')
          .delete()
          .eq('account_id', accountId)
          .eq('card_id', id)
          .eq('status', 'a_pagar');
        if (txErr) throw txErr;

        // remove debts referencing this card (by id or by name in description)
        const { error: debtIdErr } = await supabase
          .from('debts')
          .delete()
          .eq('account_id', accountId)
          .eq('card_id', id);
        if (debtIdErr) throw debtIdErr;

        const { error: debtNameErr } = await supabase
          .from('debts')
          .delete()
          .eq('account_id', accountId)
          .ilike('description', `%(${cardName}%`);
        if (debtNameErr) throw debtNameErr;
      }

      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    cards,
    isLoading: isPending,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    addCard: addMutation.mutateAsync,
    updateCard: updateMutation.mutateAsync,
    deleteCard: deleteMutation.mutateAsync,
  };
}
