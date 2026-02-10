import { useEffect, useMemo } from "react";
import { Transaction, TransactionFormValues } from "../types";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface DateRange {
    from: Date;
    to: Date;
}

export function useFinance(filter?: DateRange) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = ["transactions", user?.id];

    // Read: Fetch transactions using useQuery + onSnapshot sync
    const { data: transactions = [] } = useQuery<Transaction[]>({
        queryKey,
        queryFn: () => [], // Initial data is empty, will be populated by onSnapshot
        enabled: !!user,
        staleTime: Infinity,
    });

    // Real-time sync with Firestore
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.id, "transactions"),
            orderBy("date", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            })) as Transaction[];

            // Explicitly update the query cache when Firestore data changes
            queryClient.setQueryData(queryKey, txs);
        });

        return () => unsubscribe();
    }, [user, queryClient, queryKey]);

    // Create: Use mutation with Optimistic Update
    const addMutation = useMutation({
        mutationFn: async (data: TransactionFormValues) => {
            if (!user) throw new Error("User not authenticated");
            return addDoc(collection(db, "users", user.id, "transactions"), {
                ...data,
                createdAt: new Date().toISOString(),
            });
        },
        onMutate: async (newT) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKey);

            // Optimistically update the cache
            queryClient.setQueryData(queryKey, (old: Transaction[] = []) => [
                {
                    ...newT,
                    id: "temp-id",
                    createdAt: new Date().toISOString()
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

    // Delete: Use mutation with Optimistic Update
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!user) throw new Error("User not authenticated");
            return deleteDoc(doc(db, "users", user.id, "transactions", id));
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey });
            const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKey);

            // Optimistically remove from cache
            queryClient.setQueryData(queryKey, (old: Transaction[] = []) =>
                old.filter((t) => t.id !== id)
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

    const filteredTransactions = useMemo(() => {
        if (!filter) return transactions;
        return transactions.filter(t => {
            const txDate = parseISO(t.date);
            return isWithinInterval(txDate, {
                start: startOfDay(filter.from),
                end: endOfDay(filter.to)
            });
        });
    }, [transactions, filter]);

    const summary = filteredTransactions.reduce(
        (acc, t) => {
            if (t.type === "income") {
                acc.income += t.amount;
                acc.balance += t.amount;
            } else {
                acc.expense += t.amount;
                acc.balance -= t.amount;
            }
            return acc;
        },
        { income: 0, expense: 0, balance: 0 }
    );

    const exportToCSV = () => {
        const headers = ["Descrição", "Valor", "Categoria", "Tipo", "Status", "Data", "Data do Cadastro"];
        const rows = transactions.map((t) => [
            t.description,
            t.amount.toFixed(2),
            t.category,
            t.type === 'income' ? 'Entrada' : 'Saída',
            t.status === 'pago' ? 'Pago' :
                t.status === 'a_pagar' ? 'A Pagar' :
                    t.status === 'recebido' ? 'Recebido' : 'A Receber',
            format(parseISO(t.date), "dd/MM/yyyy", { locale: ptBR }),
            format(parseISO(t.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        ]);

        const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "transacoes_seara_finance.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return {
        transactions: filteredTransactions,
        addTransaction: addMutation.mutate,
        removeTransaction: deleteMutation.mutate,
        exportToCSV,
        summary,
        isLoading: addMutation.isPending || deleteMutation.isPending,
    };
}
