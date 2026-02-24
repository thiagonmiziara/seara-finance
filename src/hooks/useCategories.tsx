import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/lib/categories';

type Category = { value: string; label: string; color: string; id?: string };

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40) || 'categoria'
  );
}

type CategoriesContextValue = {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  addCategory: (opts: { label: string; color?: string }) => Promise<Category>;
  deleteCategory: (value: string) => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextValue | undefined>(
  undefined,
);

function useCategoriesInternal() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // load any locally saved categories first so they appear immediately
    const LOCAL_KEY = 'seara:categories';
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const localCats = JSON.parse(raw) as Category[];
        if (Array.isArray(localCats) && localCats.length > 0) {
          setCategories((prev) => {
            // merge unique by value
            const map = new Map<string, Category>();
            prev.forEach((c) => map.set(c.value, c));
            localCats.forEach((c) => map.set(c.value, c));
            return Array.from(map.values());
          });
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }

    if (!user) {
      setCategories(DEFAULT_CATEGORIES);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.id, 'categories'),
      orderBy('label', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        if (snap.empty) {
          // If there are already custom/local categories in state, keep them.
          setCategories((prev) => {
            const hasCustom = prev.some(
              (c) => !DEFAULT_CATEGORIES.find((d) => d.value === c.value),
            );
            if (hasCustom) return prev;
            return DEFAULT_CATEGORIES.map((c) => ({ ...c }));
          });
          setLoading(false);
          return;
        }

        const cats: Category[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        // Merge any locally stored categories into Firestore-backed list and try to persist them
        const LOCAL_KEY = 'seara:categories';
        try {
          const raw = localStorage.getItem(LOCAL_KEY);
          const localCats = raw ? (JSON.parse(raw) as Category[]) : [];

          // determine which local cats are not in snapshot
          const snapValues = new Set(cats.map((c) => c.value));
          const toSync = localCats.filter((lc) => !snapValues.has(lc.value));

          for (const lc of toSync) {
            try {
              const collRef = collection(db, 'users', user.id, 'categories');
              await addDoc(collRef, {
                value: lc.value,
                label: lc.label,
                color: lc.color || '#374151',
                createdAt: new Date().toISOString(),
              });
            } catch (e) {
              // if sync fails, keep local
              console.error('Failed to sync local category to Firestore', e);
            }
          }

          // clear local storage after attempting sync
          if (toSync.length > 0) {
            localStorage.removeItem(LOCAL_KEY);
          }
        } catch (e) {
          // ignore localStorage parse errors
        }

        setCategories(cats);
        setLoading(false);
      },
      (e) => {
        setError(e as any);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  const addCategory = useCallback(
    async ({ label, color }: { label: string; color?: string }) => {
      const valueBase = slugify(label);
      let finalValue = valueBase;

      // pick a random color that's not already used
      function pickRandomColor(existing: string[]) {
        const palette = [
          '#16a34a', // green
          '#2563eb', // blue
          '#ef4444', // red
          '#f59e0b', // amber
          '#8b5cf6', // violet
          '#e11d48',
          '#0ea5a4',
          '#06b6d4',
          '#84cc16',
          '#f97316',
          '#10b981',
          '#7c3aed',
          '#ef7b45',
          '#1e293b',
          '#374151',
        ];

        const used = new Set(existing.map((c) => c.toLowerCase()));
        const options = palette.filter((p) => !used.has(p.toLowerCase()));
        if (options.length > 0) {
          return options[Math.floor(Math.random() * options.length)];
        }

        // fallback: generate random hex that's not in used
        for (let i = 0; i < 10; i++) {
          const rand =
            '#' +
            Math.floor(Math.random() * 0xffffff)
              .toString(16)
              .padStart(6, '0');
          if (!used.has(rand.toLowerCase())) return rand;
        }
        return '#374151';
      }

      if (user) {
        try {
          const collRef = collection(db, 'users', user.id, 'categories');

          // quick check for existing value
          const existing = await getDocs(
            query(collRef, where('value', '==', valueBase)),
          );
          if (!existing.empty) {
            let i = 1;
            while (true) {
              const candidate = `${valueBase}-${i}`;
              const ex = await getDocs(
                query(collRef, where('value', '==', candidate)),
              );
              if (ex.empty) {
                finalValue = candidate;
                break;
              }
              i += 1;
            }
          }

          // determine chosen color avoiding duplicates
          const existingColors = (
            (await getDocs(query(collRef))).docs.map(
              (d) => (d.data() as any).color,
            ) || []
          ).filter(Boolean) as string[];
          const chosenColor =
            color ||
            pickRandomColor(
              existingColors.concat(DEFAULT_CATEGORIES.map((c) => c.color)),
            );

          const docRef = await addDoc(collRef, {
            value: finalValue,
            label,
            color: chosenColor,
            createdAt: new Date().toISOString(),
          });

          const newCat = {
            id: docRef.id,
            value: finalValue,
            label,
            color: chosenColor,
          };
          setCategories((prev) => {
            const next = [
              ...prev.filter((c) => c.value !== newCat.value),
              newCat,
            ];
            try {
              localStorage.setItem(
                'seara:categories',
                JSON.stringify(
                  next.filter(
                    (c) => !DEFAULT_CATEGORIES.find((d) => d.value === c.value),
                  ),
                ),
              );
            } catch (e) {}
            return next;
          });
          return newCat;
        } catch (e) {
          // If Firestore write fails, fall through to local creation
          console.error(
            'Failed to persist category to Firestore, falling back to local:',
            e,
          );
        }
      }

      // local fallback (no user or firestore error)
      // ensure local uniqueness
      let i = 1;
      while (categories.find((c) => c.value === finalValue)) {
        finalValue = `${valueBase}-${i}`;
        i += 1;
      }

      const newCat = {
        value: finalValue,
        label,
        color:
          color ||
          pickRandomColor([
            ...categories.map((c) => c.color).filter(Boolean),
            ...DEFAULT_CATEGORIES.map((c) => c.color),
          ]),
      } as Category;
      setCategories((prev) => {
        const next = [...prev.filter((c) => c.value !== newCat.value), newCat];
        try {
          // persist only custom categories to localStorage
          localStorage.setItem(
            'seara:categories',
            JSON.stringify(
              next.filter(
                (c) => !DEFAULT_CATEGORIES.find((d) => d.value === c.value),
              ),
            ),
          );
        } catch (e) {
          // ignore storage errors
        }
        return next;
      });
      return newCat;
    },
    [user, categories],
  );

  const deleteCategory = useCallback(
    async (value: string) => {
      // If user is not logged, just remove from localStorage and state
      if (!user) {
        try {
          const LOCAL_KEY = 'seara:categories';
          const raw = localStorage.getItem(LOCAL_KEY);
          const localCats: Category[] = raw ? JSON.parse(raw) : [];
          const next = localCats.filter((c) => c.value !== value);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        } catch (e) {
          // ignore
        }
        setCategories((prev) => prev.filter((c) => c.value !== value));
        return;
      }

      try {
        const q = query(
          collection(db, 'users', user.id, 'categories'),
          where('value', '==', value),
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          // nothing in firestore; still remove locally
          setCategories((prev) => prev.filter((c) => c.value !== value));
          try {
            const LOCAL_KEY = 'seara:categories';
            const raw = localStorage.getItem(LOCAL_KEY);
            const localCats: Category[] = raw ? JSON.parse(raw) : [];
            const next = localCats.filter((c) => c.value !== value);
            localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
          } catch (e) {}
          return;
        }

        const { deleteDoc } = await import('firebase/firestore');
        // delete all matching documents (should be at most one)
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }

        // after successful deletion from Firestore, update local state/storage
        setCategories((prev) => prev.filter((c) => c.value !== value));
        try {
          const LOCAL_KEY = 'seara:categories';
          const raw = localStorage.getItem(LOCAL_KEY);
          const localCats: Category[] = raw ? JSON.parse(raw) : [];
          const next = localCats.filter((c) => c.value !== value);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        } catch (e) {}
      } catch (e: any) {
        // If deletion fails (for example due to Firestore permissions),
        // fallback to removing the category locally and do not log to console.
        try {
          const LOCAL_KEY = 'seara:categories';
          const raw = localStorage.getItem(LOCAL_KEY);
          const localCats: Category[] = raw ? JSON.parse(raw) : [];
          const next = localCats.filter((c) => c.value !== value);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        } catch (e2) {
          // ignore localStorage errors
        }
        setCategories((prev) => prev.filter((c) => c.value !== value));
        // swallow original error to avoid console noise
        return;
      }
    },
    [user],
  );

  return { categories, loading, error, addCategory, deleteCategory } as const;
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const value = useCategoriesInternal();
  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (ctx) return ctx;
  return useCategoriesInternal();
}

export type { Category };
