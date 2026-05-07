import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/lib/categories';

type Category = { value: string; label: string; color: string; id?: string };

const PALETTE = [
  '#2563eb',
  '#2563eb',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#e11d48',
  '#0ea5a4',
  '#06b6d4',
  '#0ea5e9',
  '#f97316',
  '#3b82f6',
  '#7c3aed',
  '#ef7b45',
  '#1e293b',
  '#374151',
];

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40) || 'categoria'
  );
}

function pickRandomColor(existing: string[]) {
  const used = new Set(existing.map((c) => c.toLowerCase()));
  const options = PALETTE.filter((p) => !used.has(p.toLowerCase()));
  if (options.length > 0) {
    return options[Math.floor(Math.random() * options.length)];
  }
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

interface CategoryRow {
  id: string;
  value: string;
  label: string;
  color: string;
}

function mergeWithDefaults(custom: Category[]): Category[] {
  const merged = new Map<string, Category>();
  DEFAULT_CATEGORIES.forEach((c) => merged.set(c.value, { ...c }));
  custom.forEach((c) => merged.set(c.value, c));
  return Array.from(merged.values());
}

function useCategoriesInternal(): CategoriesContextValue {
  const { user } = useAuth();
  const { accountId } = useAccount();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !accountId) {
      setCategories(DEFAULT_CATEGORIES);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const { data, error: err } = await supabase
        .from('categories')
        .select('id, value, label, color')
        .eq('account_id', accountId)
        .order('label', { ascending: true });
      if (cancelled) return;
      if (err) {
        setError(err as unknown as Error);
        setLoading(false);
        return;
      }
      setCategories(mergeWithDefaults((data as CategoryRow[]) ?? []));
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`categories:${accountId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `account_id=eq.${accountId}`,
        },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, accountId]);

  const addCategory = useCallback(
    async ({ label, color }: { label: string; color?: string }) => {
      const valueBase = slugify(label);
      let finalValue = valueBase;

      if (!user || !accountId) {
        // local-only fallback (não persiste server-side)
        let i = 1;
        while (categories.find((c) => c.value === finalValue)) {
          finalValue = `${valueBase}-${i}`;
          i += 1;
        }
        const newCat: Category = {
          value: finalValue,
          label,
          color:
            color ||
            pickRandomColor([
              ...categories.map((c) => c.color),
              ...DEFAULT_CATEGORIES.map((c) => c.color),
            ]),
        };
        setCategories((prev) => [...prev, newCat]);
        return newCat;
      }

      // ensure value uniqueness
      const { data: existing, error: existingErr } = await supabase
        .from('categories')
        .select('value')
        .eq('account_id', accountId);
      if (existingErr) throw existingErr;
      const usedValues = new Set(
        (existing ?? []).map((r: { value: string }) => r.value),
      );
      let attempt = 1;
      while (usedValues.has(finalValue)) {
        finalValue = `${valueBase}-${attempt}`;
        attempt++;
      }

      const usedColors = (existing ?? [])
        .map((r: any) => r.color as string | undefined)
        .filter(Boolean) as string[];
      const chosenColor =
        color ||
        pickRandomColor([
          ...usedColors,
          ...DEFAULT_CATEGORIES.map((c) => c.color),
        ]);

      const { data: inserted, error: insertErr } = await supabase
        .from('categories')
        .insert({
          account_id: accountId,
          value: finalValue,
          label,
          color: chosenColor,
        })
        .select('id, value, label, color')
        .single();
      if (insertErr) throw insertErr;

      const newCat: Category = {
        id: inserted.id,
        value: inserted.value,
        label: inserted.label,
        color: inserted.color,
      };
      setCategories((prev) => [
        ...prev.filter((c) => c.value !== newCat.value),
        newCat,
      ]);
      return newCat;
    },
    [user, accountId, categories],
  );

  const deleteCategory = useCallback(
    async (value: string) => {
      if (DEFAULT_CATEGORIES.some((d) => d.value === value)) {
        return; // nunca apaga default
      }
      if (!user || !accountId) {
        setCategories((prev) => prev.filter((c) => c.value !== value));
        return;
      }
      const { error: delErr } = await supabase
        .from('categories')
        .delete()
        .eq('account_id', accountId)
        .eq('value', value);
      if (delErr) {
        // swallow and remove locally to avoid noise
      }
      setCategories((prev) => prev.filter((c) => c.value !== value));
    },
    [user, accountId],
  );

  return { categories, loading, error, addCategory, deleteCategory };
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
