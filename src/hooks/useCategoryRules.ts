import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';

export interface CategoryRule {
  id: string;
  pattern: string;
  category: string;
  createdAt: string;
}

export function useCategoryRules() {
  const { user } = useAuth();
  const { accountType } = useAccount();
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'users', user.id, 'accounts', accountType, 'categoryRules');
    const unsub = onSnapshot(ref, (snap) => {
      setRules(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      } as CategoryRule)));
      setIsLoading(false);
    });
    return unsub;
  }, [user, accountType]);

  const createRule = useCallback(async (pattern: string, category: string) => {
    if (!user) return;
    await addDoc(
      collection(db, 'users', user.id, 'accounts', accountType, 'categoryRules'),
      {
        pattern: pattern.toLowerCase().trim(),
        category,
        createdAt: new Date().toISOString(),
      }
    );
  }, [user, accountType]);

  const deleteRule = useCallback(async (ruleId: string) => {
    if (!user) return;
    await deleteDoc(
      doc(db, 'users', user.id, 'accounts', accountType, 'categoryRules', ruleId)
    );
  }, [user, accountType]);

  const matchCategory = useCallback((description: string): string | null => {
    const desc = description.toLowerCase().trim();
    const match = rules.find(r => desc.includes(r.pattern));
    return match ? match.category : null;
  }, [rules]);

  return { rules, isLoading, createRule, deleteRule, matchCategory };
}
