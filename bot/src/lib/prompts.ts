// Carrega prompts editáveis do Supabase com cache em memória.
//
// Uso:
//   const { content, model, temperature } = await getPrompt('intent_parser', {
//     today: '2026-05-06',
//     categories: 'alimentacao, transporte, ...',
//   });
//
// Cache: 60s. Fallback: defaults locais quando Supabase off ou prompt ausente.

import { supabase, isSupabaseReady } from './supabase.js';

interface PromptRow {
  key: string;
  content: string;
  model: string | null;
  temperature: number | string | null;
  is_active: boolean;
}

interface ResolvedPrompt {
  content: string;
  model: string | null;
  temperature: number | null;
}

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; row: PromptRow | null }>();

async function loadFromDb(key: string): Promise<PromptRow | null> {
  if (!isSupabaseReady()) return null;
  const { data, error } = await supabase
    .from('bot_prompts')
    .select('key, content, model, temperature, is_active')
    .eq('key', key)
    .eq('is_active', true)
    .maybeSingle();
  if (error) {
    console.error(`[prompts] read failed key=${key}: ${error.message}`);
    return null;
  }
  return (data as PromptRow | null) ?? null;
}

function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : `{{${name}}}`,
  );
}

export async function getPrompt(
  key: string,
  vars: Record<string, string> = {},
  fallback?: string,
): Promise<ResolvedPrompt> {
  const now = Date.now();
  const cached = cache.get(key);
  let row: PromptRow | null;
  if (cached && now - cached.at < TTL_MS) {
    row = cached.row;
  } else {
    row = await loadFromDb(key);
    cache.set(key, { at: now, row });
  }

  const raw = row?.content ?? fallback ?? '';
  const content = substitute(raw, vars);
  const temperature =
    row?.temperature == null
      ? null
      : typeof row.temperature === 'string'
        ? Number(row.temperature)
        : row.temperature;
  return {
    content,
    model: row?.model ?? null,
    temperature: Number.isFinite(temperature) ? (temperature as number) : null,
  };
}

/** Invalida o cache — útil pra forçar recarregar após edição manual. */
export function invalidatePromptCache(key?: string): void {
  if (key) cache.delete(key);
  else cache.clear();
}
