// Supabase client running with the service role — this bot is server-side
// and trusted (only the user owns their WhatsApp number, and we authenticate
// requests by E.164 lookup). RLS is bypassed on purpose.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseConfigured = !!SUPABASE_URL && !!SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseConfigured) {
  console.warn(
    '[bot] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes — chamadas Supabase ficarão como no-op até preencher.',
  );
}

// Fallback to a syntactically valid URL/key so createClient doesn't throw at
// import time. Real calls fail gracefully.
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY || 'placeholder.placeholder.placeholder',
  {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: {} },
  },
);

export const isSupabaseReady = () => supabaseConfigured;

export interface BotUser {
  id: string;
  firebase_uid: string;
  email: string;
  name: string | null;
  whatsapp_phone_e164: string;
  account_id: string;
}

export async function findUserByPhone(
  phoneE164: string,
): Promise<BotUser | null> {
  if (!supabaseConfigured) return null;
  const { data: u } = await supabase
    .from('users')
    .select('id, firebase_uid, email, name, whatsapp_phone_e164')
    .eq('whatsapp_phone_e164', phoneE164)
    .maybeSingle();
  if (!u) return null;
  const { data: acc } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', u.id)
    .eq('type', 'personal')
    .maybeSingle();
  if (!acc) return null;
  return { ...u, account_id: acc.id } as BotUser;
}

export interface NewTransaction {
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  status: 'pago' | 'a_pagar' | 'recebido' | 'a_receber';
  date: string; // YYYY-MM-DD
}

export async function insertTransaction(
  accountId: string,
  tx: NewTransaction,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('transactions')
    .insert({ account_id: accountId, ...tx });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const BUILTIN_CATEGORIES = [
  'salario',
  'compras',
  'alimentacao',
  'transporte',
  'lazer',
  'moradia',
  'saude',
  'outros',
];

export async function listCategories(accountId: string): Promise<string[]> {
  const { data } = await supabase
    .from('categories')
    .select('value')
    .eq('account_id', accountId);
  const custom = (data ?? []).map((r: { value: string }) => r.value);
  return Array.from(new Set([...BUILTIN_CATEGORIES, ...custom]));
}

const PALETTE = [
  '#214b94',
  '#2563eb',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#0ea5e9',
  '#22c55e',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '')
      .slice(0, 40) || 'outros'
  );
}

function titleCase(slug: string): string {
  return slug
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Garante que a categoria existe pra esse account. Se não existir e não for
 * uma builtin, cria. Retorna o slug canônico (sempre minúsculo, sem acento).
 */
export async function ensureCategory(
  accountId: string,
  rawValue: string,
): Promise<string> {
  const value = slugify(rawValue);
  if (BUILTIN_CATEGORIES.includes(value)) return value;

  const { data: existing } = await supabase
    .from('categories')
    .select('value')
    .eq('account_id', accountId)
    .eq('value', value)
    .maybeSingle();
  if (existing) return value;

  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  const { error } = await supabase.from('categories').insert({
    account_id: accountId,
    value,
    label: titleCase(value),
    color,
  });
  if (error) {
    console.error(`[bot] ensureCategory falhou: ${error.message}`);
    return 'outros';
  }
  return value;
}

export interface NewDebt {
  description: string;
  total_amount: number;
  installments: number;
  installment_amount: number;
  paid_installments: number;
  status: 'a_pagar' | 'pago';
  due_date: string;
}

export async function insertDebt(
  accountId: string,
  d: NewDebt,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfigured) return { ok: false, error: 'supabase off' };
  const { error } = await supabase
    .from('debts')
    .insert({ account_id: accountId, ...d });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface NewRecurringBill {
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  due_day: number;
  is_active: boolean;
}

export async function insertRecurringBill(
  accountId: string,
  r: NewRecurringBill,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfigured) return { ok: false, error: 'supabase off' };
  const { error } = await supabase
    .from('recurring_bills')
    .insert({ account_id: accountId, ...r });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  count: number;
  topExpenseCategories: Array<{ category: string; amount: number }>;
  fromIso: string;
  toIso: string;
}

export async function getSummary(
  accountId: string,
  from: Date,
  to: Date,
): Promise<Summary> {
  const fromIso = from.toISOString().split('T')[0];
  const toIso = to.toISOString().split('T')[0];
  const { data } = await supabase
    .from('transactions')
    .select('amount, type, category')
    .eq('account_id', accountId)
    .gte('date', fromIso)
    .lte('date', toIso);
  const rows = (data ?? []) as Array<{
    amount: number | string;
    type: 'income' | 'expense';
    category: string;
  }>;
  let income = 0;
  let expense = 0;
  const byCat = new Map<string, number>();
  for (const r of rows) {
    const amt =
      typeof r.amount === 'string' ? Number(r.amount) : (r.amount as number);
    if (r.type === 'income') {
      income += amt;
    } else {
      expense += amt;
      byCat.set(r.category, (byCat.get(r.category) ?? 0) + amt);
    }
  }
  const top = Array.from(byCat.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  return {
    income,
    expense,
    balance: income - expense,
    count: rows.length,
    topExpenseCategories: top,
    fromIso,
    toIso,
  };
}
