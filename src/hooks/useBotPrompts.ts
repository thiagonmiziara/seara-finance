import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface BotPromptVariable {
  name: string;
  description: string;
}

export interface BotPrompt {
  key: string;
  title: string;
  description: string | null;
  content: string;
  variables: BotPromptVariable[];
  model: string | null;
  temperature: number | null;
  is_active: boolean;
  version: number;
  updated_at: string;
  updated_by: string | null;
}

interface BotPromptRow {
  key: string;
  title: string;
  description: string | null;
  content: string;
  variables: unknown;
  model: string | null;
  temperature: number | string | null;
  is_active: boolean;
  version: number;
  updated_at: string;
  updated_by: string | null;
}

function rowToPrompt(row: BotPromptRow): BotPrompt {
  let vars: BotPromptVariable[] = [];
  if (Array.isArray(row.variables)) {
    vars = row.variables.filter(
      (v): v is BotPromptVariable =>
        !!v && typeof v === 'object' && 'name' in v && 'description' in v,
    );
  }
  const temp =
    row.temperature == null
      ? null
      : typeof row.temperature === 'string'
        ? Number(row.temperature)
        : row.temperature;
  return {
    ...row,
    variables: vars,
    temperature: Number.isFinite(temp) ? (temp as number) : null,
  };
}

export interface UpdatePromptInput {
  title?: string;
  description?: string | null;
  content?: string;
  model?: string | null;
  temperature?: number | null;
  is_active?: boolean;
}

export function useBotPrompts() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<BotPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('bot_prompts')
      .select(
        'key, title, description, content, variables, model, temperature, is_active, version, updated_at, updated_by',
      )
      .order('key');
    if (error) {
      setError(error.message);
      setPrompts([]);
    } else {
      setPrompts((data as BotPromptRow[]).map(rowToPrompt));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const update = useCallback(
    async (key: string, patch: UpdatePromptInput) => {
      const current = prompts.find((p) => p.key === key);
      const payload: Record<string, unknown> = {
        ...patch,
        updated_by: user?.email ?? null,
      };
      if (patch.content !== undefined && current) {
        payload.version = current.version + 1;
      }
      const { error } = await supabase
        .from('bot_prompts')
        .update(payload)
        .eq('key', key);
      if (error) throw new Error(error.message);
      await refetch();
    },
    [prompts, refetch, user?.email],
  );

  return { prompts, loading, error, refetch, update };
}
