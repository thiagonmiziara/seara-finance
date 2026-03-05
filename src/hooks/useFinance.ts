import { useEffect, useMemo } from 'react';
import { Transaction, TransactionFormValues } from '../types';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

export function useFinance(filter?: DateRange) {
  const { user } = useAuth();
  const { accountType } = useAccount();
  const { categories } = useCategories();
  const queryClient = useQueryClient();
  const queryKey = ['transactions', user?.id, accountType];

  // Read: Fetch transactions using useQuery + onSnapshot sync
  const { data: transactions = [], isPending } = useQuery<Transaction[]>({
    queryKey,
    queryFn: () => [], // Initial data is empty, will be populated by onSnapshot
    enabled: !!user,
    staleTime: Infinity,
  });

  // Real-time sync with Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.id, 'accounts', accountType, 'transactions'),
      orderBy('date', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map((doc) => {
        const data = doc.data() as any;

        // Normalize Firestore Timestamp -> ISO string if needed
        const normalizeDate = (val: any) => {
          if (!val) return val;
          // Firestore Timestamp has toDate()
          if (typeof val.toDate === 'function') {
            return val.toDate().toISOString();
          }
          // If it's an object with seconds/nanos
          if (val.seconds !== undefined && val.nanoseconds !== undefined) {
            return new Date(
              val.seconds * 1000 + Math.floor(val.nanoseconds / 1e6),
            ).toISOString();
          }
          // already a string
          return val;
        };

        return {
          ...data,
          id: doc.id,
          date: normalizeDate(data.date),
          createdAt: normalizeDate(data.createdAt),
        } as Transaction;
      });

      // Explicitly update the query cache when Firestore data changes
      queryClient.setQueryData(queryKey, txs);
    });

    return () => unsubscribe();
  }, [user, accountType, queryClient, queryKey]);

  // Create: Use mutation with Optimistic Update
  const addMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      if (!user) throw new Error('User not authenticated');

      const { cardId, installmentsTotal, ...restData } = data;

      if (data.type === 'expense' && cardId) {
        // Fetch card details
        const cardRef = doc(db, 'users', user.id, 'accounts', accountType, 'cards', cardId);
        const cardSnap = await getDoc(cardRef);
        if (!cardSnap.exists()) throw new Error('Card not found');
        const card = cardSnap.data() as { closingDay: number; dueDay: number; name: string };

        const purchaseDate = new Date(data.date + 'T00:00:00');
        const batch = writeBatch(db);
        const totalInst = installmentsTotal || 1;
        const baseAmount = data.amount / totalInst;

        // Calculate first due date
        let firstInvoiceMonth = purchaseDate.getMonth();
        const firstInvoiceYear = purchaseDate.getFullYear();
        if (purchaseDate.getDate() >= card.closingDay) {
          firstInvoiceMonth += 1;
        }
        const firstDueDate = new Date(firstInvoiceYear, firstInvoiceMonth, card.dueDay);

        // Create installment transactions
        for (let i = 1; i <= totalInst; i++) {
          let invoiceMonth = purchaseDate.getMonth();
          const invoiceYear = purchaseDate.getFullYear();

          if (purchaseDate.getDate() >= card.closingDay) {
            invoiceMonth += 1;
          }
          invoiceMonth += (i - 1);

          const dueDate = new Date(invoiceYear, invoiceMonth, card.dueDay);

          const installRef = doc(collection(db, 'users', user.id, 'accounts', accountType, 'transactions'));
          batch.set(installRef, {
            ...restData,
            amount: baseAmount,
            cardId: cardId,
            installments: { current: i, total: totalInst },
            date: dueDate.toISOString().split('T')[0],
            status: 'a_pagar',
            createdAt: new Date().toISOString()
          });
        }

        // Also create a Debt entry for consolidated view in Dívidas tab
        const debtRef = doc(collection(db, 'users', user.id, 'accounts', accountType, 'debts'));
        batch.set(debtRef, {
          description: `${data.description} (${card.name} - ${totalInst}x)`,
          totalAmount: data.amount,
          installments: totalInst,
          installmentAmount: baseAmount,
          paidInstallments: 0,
          status: 'a_pagar',
          dueDate: firstDueDate.toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          cardId: cardId,
        });

        await batch.commit();
        return;
      }

      // Normal transaction
      return addDoc(collection(db, 'users', user.id, 'accounts', accountType, 'transactions'), {
        ...restData,
        createdAt: new Date().toISOString(),
      });
    },
    onMutate: async (newT) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTransactions =
        queryClient.getQueryData<Transaction[]>(queryKey);

      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (old: Transaction[] = []) => [
        {
          ...newT,
          id: 'temp-id',
          createdAt: new Date().toISOString(),
        } as Transaction,
        ...old,
      ]);

      return { previousTransactions };
    },
    onError: (_err, _newT, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKey, context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addTransferMutation = useMutation({
    mutationFn: async ({ sourceData, destinationData, destinationAccountType }: { sourceData: TransactionFormValues, destinationData: TransactionFormValues, destinationAccountType: string }) => {
      if (!user) throw new Error('User not authenticated');

      const batch = writeBatch(db);

      const sourceRef = doc(collection(db, 'users', user.id, 'accounts', accountType, 'transactions'));
      batch.set(sourceRef, {
        ...sourceData,
        createdAt: new Date().toISOString(),
      });

      const destRef = doc(collection(db, 'users', user.id, 'accounts', destinationAccountType, 'transactions'));
      batch.set(destRef, {
        ...destinationData,
        createdAt: new Date().toISOString(),
      });

      await batch.commit();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete: Use mutation with Optimistic Update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      return deleteDoc(doc(db, 'users', user.id, 'accounts', accountType, 'transactions', id));
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTransactions =
        queryClient.getQueryData<Transaction[]>(queryKey);

      // Optimistically remove from cache
      queryClient.setQueryData(queryKey, (old: Transaction[] = []) =>
        old.filter((t) => t.id !== id),
      );

      return { previousTransactions };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKey, context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

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
      const isPendingStatus =
        t.status === 'a_pagar' || t.status === 'a_receber';

      let txDate: Date | null = null;
      try {
        if (isPendingStatus) {
          if (t.cardId) {
            txDate = t.date ? parseTransactionDate(t.date) : null;
          } else {
            txDate = t.createdAt ? parseTransactionDate(t.createdAt) : null;
          }
        } else {
          txDate = t.date ? parseTransactionDate(t.date) : null;
        }
      } catch (e) {
        txDate = null;
      }
      if (!txDate) return false;

      return isWithinInterval(txDate, {
        start: startOfDay(filter.from),
        end: endOfDay(filter.to),
      });
    });
  }, [transactions, filter]);

  const tableTransactions = useMemo(() => {
    return dateFilteredTransactions;
  }, [dateFilteredTransactions]);

  const summary = dateFilteredTransactions.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.income += t.amount;
        acc.balance += t.amount;
      } else {
        acc.expense += t.amount;
        acc.balance -= t.amount;
      }
      return acc;
    },
    { income: 0, expense: 0, balance: 0 },
  );

  const exportToCSV = (filteredTransactions?: Transaction[]) => {
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
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transacoes_seara_finance.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    transactions: tableTransactions,
    dashboardTransactions: dateFilteredTransactions,
    addTransaction: addMutation.mutateAsync,
    addTransfer: addTransferMutation.mutateAsync,
    removeTransaction: deleteMutation.mutateAsync,
    exportToCSV,
    summary,
    isAdding: addMutation.isPending || addTransferMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isInitialLoading: isPending && user !== null,
    isLoading: isPending || addMutation.isPending || addTransferMutation.isPending || deleteMutation.isPending,
  };
}
