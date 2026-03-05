import { useEffect, useMemo } from 'react';
import { Debt, DebtFormValues } from '../types';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useDebts() {
  const { user } = useAuth();
  const { accountType } = useAccount();
  const queryClient = useQueryClient();
  const queryKey = ['debts', user?.id, accountType];

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
    });

    return () => unsubscribe();
  }, [user, accountType, queryClient, queryKey]);

  const addMutation = useMutation({
    mutationFn: async (data: DebtFormValues) => {
      if (!user) throw new Error('User not authenticated');
      return addDoc(
        collection(db, 'users', user.id, 'accounts', accountType, 'debts'),
        {
          ...data,
          paidInstallments: 0,
          createdAt: new Date().toISOString(),
        },
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
      data: Partial<DebtFormValues>;
    }) => {
      if (!user) throw new Error('User not authenticated');
      return updateDoc(
        doc(db, 'users', user.id, 'accounts', accountType, 'debts', id),
        data,
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

    return updateMutation.mutateAsync({
      id: debt.id,
      data: {
        paidInstallments: newPaid,
        status: newStatus,
      },
    });
  };

  const settleDebt = async (debt: Debt) => {
    return updateMutation.mutateAsync({
      id: debt.id,
      data: {
        paidInstallments: debt.installments,
        status: 'pago',
      },
    });
  };

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
