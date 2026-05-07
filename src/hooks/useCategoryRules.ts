import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';

export interface CategoryRule {
  id: string;
  pattern: string;
  category: string;
  createdAt: string;
}

interface RuleRow {
  id: string;
  pattern: string;
  category: string;
  created_at: string;
}

function rowToRule(row: RuleRow): CategoryRule {
  return {
    id: row.id,
    pattern: row.pattern,
    category: row.category,
    createdAt: row.created_at,
  };
}

export function useCategoryRules() {
  const { user } = useAuth();
  const { accountId } = useAccount();
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !accountId) {
      setRules([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase
        .from('category_rules')
        .select('id, pattern, category, created_at')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (!error) {
        setRules((data as RuleRow[]).map(rowToRule));
      }
      setIsLoading(false);
    };
    load();

    const channel = supabase
      .channel(`category_rules:${accountId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'category_rules',
          filter: `account_id=eq.${accountId}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, accountId]);

  const createRule = useCallback(
    async (pattern: string, category: string) => {
      if (!accountId) return;
      const { error } = await supabase.from('category_rules').insert({
        account_id: accountId,
        pattern: pattern.toLowerCase().trim(),
        category,
      });
      if (error) throw error;
    },
    [accountId],
  );

  const deleteRule = useCallback(async (ruleId: string) => {
    const { error } = await supabase
      .from('category_rules')
      .delete()
      .eq('id', ruleId);
    if (error) throw error;
  }, []);

  const matchCategory = useCallback(
    (description: string): string | null => {
      const desc = description.toLowerCase().trim();
      const match = rules.find((r) => desc.includes(r.pattern));
      return match ? match.category : null;
    },
    [rules],
  );

  return { rules, isLoading, createRule, deleteRule, matchCategory };
}
