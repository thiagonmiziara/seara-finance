/**
 * Portado de whatsapp-bot/src/services/parser.ts — só as funções puras de
 * interpretação de texto livre ("paguei 50 no mercado"). Sessão em Map
 * global, setInterval e o passo `awaiting_account` do bot NÃO foram
 * portados: o app já resolve a conta atual e o motor de chat (engine.ts)
 * guarda o estado da conversa via useReducer.
 */

export interface QuickCategory {
  value: string;
  label: string;
}

export interface NaturalTransaction {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: QuickCategory;
}

const EXPENSE_VERBS = ['paguei', 'gastei', 'pago', 'comprei', 'paga'];
const INCOME_VERBS = ['recebi', 'ganhei', 'recebido'];
const STOP_WORDS = [
  'no', 'na', 'de', 'do', 'da', 'em', 'pro', 'pra', 'para', 'com',
  'o', 'a', 'os', 'as', 'um', 'uma', 'hoje', 'ontem', 'agora',
];

/** value da categoria (espelha os defaults do app) → palavras-gatilho. */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  compras: ['mercado', 'supermercado', 'feira', 'loja', 'shopping', 'compra', 'compras'],
  alimentacao: ['ifood', 'almoço', 'almoco', 'jantar', 'restaurante', 'lanche', 'café', 'cafe', 'padaria', 'pizza', 'comida', 'açaí', 'acai', 'marmita'],
  transporte: ['uber', '99', 'gasolina', 'ônibus', 'onibus', 'estacionamento', 'combustível', 'combustivel', 'metro', 'metrô', 'passagem', 'pedágio', 'pedagio'],
  salario: ['salário', 'salario', 'freelance', 'pagamento', 'pix'],
  moradia: ['aluguel', 'condomínio', 'condominio', 'luz', 'água', 'agua', 'internet', 'gás', 'gas', 'iptu'],
  saude: ['farmácia', 'farmacia', 'médico', 'medico', 'dentista', 'hospital', 'remédio', 'remedio', 'consulta', 'exame'],
  educacao: ['curso', 'livro', 'escola', 'faculdade', 'mensalidade', 'apostila'],
  lazer: ['netflix', 'cinema', 'jogo', 'bar', 'festa', 'spotify', 'ingresso', 'show', 'viagem'],
};

function normalize(text: string): string {
  // \p{M} = qualquer marca combinante (acentos) após decompor NFD.
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Aceita formato BR: "1.500,00", "45,90" ou números simples. */
export function parseAmount(text: string): number | null {
  let cleaned = text.replace(/[^\d.,]/g, '');
  if (!cleaned) return null;

  if (/^\d{1,3}(\.\d{3})+,\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+,\d{1,2}$/.test(cleaned)) {
    cleaned = cleaned.replace(',', '.');
  }

  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? null : Math.round(num * 100) / 100;
}

/**
 * Detecta a categoria pela descrição, restrita às categorias que o usuário
 * realmente tem cadastradas (evita sugerir algo como "saúde" se ele nunca
 * criou/possui essa categoria). Cai em "outros" (ou a primeira disponível).
 */
export function autoDetectCategory(
  description: string,
  categories: QuickCategory[],
): QuickCategory | null {
  const normalized = normalize(description);

  for (const [catValue, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const category = categories.find((c) => c.value === catValue);
    if (!category) continue;
    if (keywords.some((kw) => normalized.includes(kw))) return category;
  }

  return categories.find((c) => c.value === 'outros') ?? categories[0] ?? null;
}

/**
 * "paguei 50 no mercado" / "recebi 2500 de salário" → transação completa
 * (com categoria já auto-detectada). Retorna null se não casar o padrão
 * "[verbo] [valor] [descrição]" com um verbo reconhecido.
 */
export function parseNaturalTransaction(
  rawText: string,
  categories: QuickCategory[],
): NaturalTransaction | null {
  const text = rawText.trim().toLowerCase();
  const match = text.match(/^(\S+)\s+([\d.,]+)\s+(.+)$/);
  if (!match) return null;

  const [, verb, amountStr, rest] = match;

  let type: 'income' | 'expense' | null = null;
  if (EXPENSE_VERBS.includes(verb)) type = 'expense';
  else if (INCOME_VERBS.includes(verb)) type = 'income';
  if (!type) return null;

  const amount = parseAmount(amountStr);
  if (amount === null || amount <= 0) return null;

  const words = rest.split(/\s+/).filter((w) => !STOP_WORDS.includes(w));
  if (words.length === 0) return null;

  const description = capitalize(words.join(' '));
  const category = autoDetectCategory(description, categories);
  if (!category) return null;

  return { type, amount, description, category };
}
