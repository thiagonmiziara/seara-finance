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
    updateDoc,
    query,
    orderBy,
    onSnapshot,
    writeBatch,
    where,
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

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CreditCardFormValues> }) => {
            if (!user) throw new Error('User not authenticated');
            await updateDoc(doc(db, 'users', user.id, 'accounts', accountType, 'cards', id), data);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ id, cardName, cascadeDelete }: { id: string; cardName: string; cascadeDelete: boolean }) => {
            if (!user) throw new Error('User not authenticated');

            if (cascadeDelete) {
                const batch = writeBatch(db);

                // Delete the card itself
                batch.delete(doc(db, 'users', user.id, 'accounts', accountType, 'cards', id));

                // Delete all transactions linked to this card with status 'a_pagar'
                const txRef = collection(db, 'users', user.id, 'accounts', accountType, 'transactions');
                const txSnapshot = await getDocs(txRef);
                txSnapshot.docs.forEach((txDoc) => {
                    const data = txDoc.data();
                    if (data.cardId === id && data.status === 'a_pagar') {
                        batch.delete(txDoc.ref);
                    }
                });

                // Delete all debts linked to this card (by cardId field or by card name in description)
                const debtsRef = collection(db, 'users', user.id, 'accounts', accountType, 'debts');
                const debtsSnapshot = await getDocs(debtsRef);
                debtsSnapshot.docs.forEach((debtDoc) => {
                    const data = debtDoc.data();
                    const matchesByCardId = data.cardId === id;
                    const matchesByName = data.description && data.description.includes(`(${cardName}`);
                    if (matchesByCardId || matchesByName) {
                        batch.delete(debtDoc.ref);
                    }
                });

                await batch.commit();
            } else {
                await deleteDoc(doc(db, 'users', user.id, 'accounts', accountType, 'cards', id));
            }
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
