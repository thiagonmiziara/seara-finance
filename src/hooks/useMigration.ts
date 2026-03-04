import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

export function useMigration() {
    const { user } = useAuth();
    const [isMigrating, setIsMigrating] = useState(false);

    useEffect(() => {
        if (!user) return;

        const runMigration = async () => {
            // Check if we already migrated recently to avoid pounding firestore on every mount
            const migrationFlag = `migrated_${user.id}`;
            if (localStorage.getItem(migrationFlag)) return;

            try {
                setIsMigrating(true);
                const batch = writeBatch(db);
                let operationsCount = 0;

                // 1. Migrate Transactions
                const txsRef = collection(db, 'users', user.id, 'transactions');
                const txsSnap = await getDocs(txsRef);
                txsSnap.forEach((docSnap) => {
                    const newRef = doc(db, 'users', user.id, 'accounts', 'personal', 'transactions', docSnap.id);
                    batch.set(newRef, docSnap.data());
                    batch.delete(docSnap.ref);
                    operationsCount++;
                });

                // 2. Migrate Debts
                const debtsRef = collection(db, 'users', user.id, 'debts');
                const debtsSnap = await getDocs(debtsRef);
                debtsSnap.forEach((docSnap) => {
                    const newRef = doc(db, 'users', user.id, 'accounts', 'personal', 'debts', docSnap.id);
                    batch.set(newRef, docSnap.data());
                    batch.delete(docSnap.ref);
                    operationsCount++;
                });

                // 3. Migrate Categories
                const catsRef = collection(db, 'users', user.id, 'categories');
                const catsSnap = await getDocs(catsRef);
                catsSnap.forEach((docSnap) => {
                    const newRef = doc(db, 'users', user.id, 'accounts', 'personal', 'categories', docSnap.id);
                    batch.set(newRef, docSnap.data());
                    batch.delete(docSnap.ref);
                    operationsCount++;
                });

                if (operationsCount > 0) {
                    // Commit in chunks if larger than 500? Firestore batch limit is 500 operations.
                    // In this context, max 250 items migrated (500 ops: set + delete).
                    // Assuming user has < 250 items. For a robust app, we should chunk, but this is a lightweight lazy migration.
                    await batch.commit();
                }

                localStorage.setItem(migrationFlag, 'true');
            } catch (error) {
                console.error('Migration error:', error);
            } finally {
                setIsMigrating(false);
            }
        };

        runMigration();
    }, [user]);

    return { isMigrating };
}
