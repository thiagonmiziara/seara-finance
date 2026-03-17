import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { RecurringBill, RecurringBillFormValues } from '@/types';

export function useRecurringBills() {
  const { user } = useAuth();
  const { accountType } = useAccount();
  const queryClient = useQueryClient();
  const queryKey = ['recurringBills', user?.id, accountType];

  const { data: recurringBills = [], isPending } = useQuery<RecurringBill[]>({
    queryKey,
    queryFn: () => [],
    enabled: !!user,
    staleTime: Infinity,
  });

  // Real-time sync
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(
        db,
        'users',
        user.id,
        'accounts',
        accountType,
        'recurringBills',
      ),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bills = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          ...data,
          id: docSnap.id,
        } as RecurringBill;
      });
      queryClient.setQueryData(queryKey, bills);
    });

    return () => unsubscribe();
  }, [user, accountType, queryClient]);

  const addMutation = useMutation({
    mutationFn: async (data: RecurringBillFormValues) => {
      if (!user) throw new Error('User not authenticated');
      return addDoc(
        collection(
          db,
          'users',
          user.id,
          'accounts',
          accountType,
          'recurringBills',
        ),
        {
          ...data,
          createdAt: new Date().toISOString(),
        },
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<RecurringBillFormValues>;
    }) => {
      if (!user) throw new Error('User not authenticated');
      return updateDoc(
        doc(
          db,
          'users',
          user.id,
          'accounts',
          accountType,
          'recurringBills',
          id,
        ),
        data,
      );
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RecurringBill[]>(queryKey);
      queryClient.setQueryData(queryKey, (old: RecurringBill[] = []) =>
        old.map((b) => (b.id === id ? { ...b, ...data } : b)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      return deleteDoc(
        doc(
          db,
          'users',
          user.id,
          'accounts',
          accountType,
          'recurringBills',
          id,
        ),
      );
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RecurringBill[]>(queryKey);
      queryClient.setQueryData(queryKey, (old: RecurringBill[] = []) =>
        old.filter((b) => b.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
    },
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
