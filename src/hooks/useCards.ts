import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { CreditCard, CreditCardFormValues } from '@/types';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import { useEffect } from 'react';

export function useCards() {
    const { user } = useAuth();
    const { accountType } = useAccount();
    const queryClient = useQueryClient();

    const queryKey = ['cards', user?.id, accountType];

    useEffect(() => {
        if (!user) return;

        const cardsRef = collection(db, 'users', user.id, 'accounts', accountType, 'cards');
        const q = query(cardsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cardsObj = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as CreditCard[];

            queryClient.setQueryData(queryKey, cardsObj);
        });

        return () => unsubscribe();
    }, [user, accountType, queryClient]);

    const { data: cards = [], isPending } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!user) return [];
            const cardsRef = collection(db, 'users', user.id, 'accounts', accountType, 'cards');
            const q = query(cardsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as CreditCard[];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const addMutation = useMutation({
        mutationFn: async (data: CreditCardFormValues) => {
            if (!user) throw new Error('User not authenticated');
            const newCardRef = doc(collection(db, 'users', user.id, 'accounts', accountType, 'cards'));
            await setDoc(newCardRef, {
                ...data,
                createdAt: new Date().toISOString(),
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!user) throw new Error('User not authenticated');
            await deleteDoc(doc(db, 'users', user.id, 'accounts', accountType, 'cards', id));
        },
        // Optimistic UI updates could be added here
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        cards,
        isLoading: isPending,
        isAdding: addMutation.isPending,
        isDeleting: deleteMutation.isPending,
        addCard: addMutation.mutateAsync,
        deleteCard: deleteMutation.mutateAsync,
    };
}
