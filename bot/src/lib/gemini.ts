// Gemini wrapper: parse text intent, transcribe audio, extract receipt data.
// REST direct, no SDK — keeps deps minimal.

const API_KEY = process.env.GEMINI_API_KEY ?? '';
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export const geminiEnabled = !!API_KEY;

import type { Intent, ParsedTransaction, ReportPeriod } from './ai-types.js';
export type { Intent, ParsedTransaction, ReportPeriod } from './ai-types.js';

const SCHEMA_INTENT = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      enum: ['transaction', 'report', 'help', 'unknown'],
    },
    reason: { type: 'string' },
    transaction: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['income', 'expense'] },
        description: { type: 'string' },
        amount: { type: 'number' },
        category: { type: 'string' },
        status: {
          type: 'string',
          enum: ['pago', 'a_pagar', 'recebido', 'a_receber'],
        },
        date: { type: 'string' },
      },
    },
    period: { type: 'string', enum: ['today', 'week', 'month', 'year'] },
  },
  required: ['intent'],
};

const SCHEMA_RECEIPT = {
  type: 'object',
  properties: {
    intent: { type: 'string', enum: ['transaction', 'unknown'] },
    reason: { type: 'string' },
    transaction: SCHEMA_INTENT.properties.transaction,
  },
  required: ['intent'],
};

interface GeminiResp {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
}

async function callGemini(body: unknown): Promise<string | null> {
  if (!API_KEY) return null;
  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`[gemini] HTTP ${res.status}: ${txt.slice(0, 300)}`);
    return null;
  }
  const data = (await res.json()) as GeminiResp;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

const systemPromptIntent = (allowedCategories: string[], today: string) => `
Você é um parser de mensagens de WhatsApp em pt-BR para o app Finzap (controle financeiro pessoal).

Classifique a mensagem em UMA intenção:
- "transaction": registrar gasto ou receita
- "report":      pedir saldo, resumo, extrato
- "help":        "ajuda", "?", "como usar"
- "unknown":     qualquer outra coisa

Quando intent = "transaction", devolva também transaction com:
- type: "income" | "expense"
- description: 2-6 palavras curtas em pt-BR
- amount: número em reais (sem símbolo)
- category: UMA destas: ${allowedCategories.join(', ')}
- status: "pago" se já gastou, "a_pagar" se vai gastar; "recebido" / "a_receber" análogos
- date: YYYY-MM-DD (hoje = ${today} se não explicitado)

Quando intent = "report", devolva period = "today" | "week" | "month" | "year"
("hoje", "essa semana", "esse mês", "esse ano" — interprete livremente).

Regras numéricas (pt-BR):
- "R$ 1.500,50" → 1500.50
- "50 reais"   → 50
- "3k"         → 3000
- "vinte"      → 20

Verbos típicos:
- expense: gastei, paguei, comprei, saiu, débito, fatura
- income:  recebi, ganhei, caiu, salário, freelance, pix recebido

Se faltar campo obrigatório, intent = "unknown" com razão curta.
NUNCA invente categoria fora da lista permitida — se não souber, use "outros".

Hoje = ${today}. Responda SOMENTE o JSON.
`;

export async function parseIntent(
  message: string,
  allowedCategories: string[],
): Promise<Intent> {
  if (!geminiEnabled) return { kind: 'unknown', reason: 'gemini desligado' };
  const today = new Date().toISOString().split('T')[0];
  const text = await callGemini({
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPromptIntent(allowedCategories, today) },
          { text: `Mensagem: """${message}"""` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA_INTENT,
    },
  });
  if (!text) return { kind: 'unknown', reason: 'sem resposta do gemini' };
  return parseIntentJson(text);
}

function parseIntentJson(raw: string): Intent {
  try {
    const p = JSON.parse(raw) as {
      intent: 'transaction' | 'report' | 'help' | 'unknown';
      reason?: string;
      transaction?: ParsedTransaction;
      period?: ReportPeriod;
    };
    if (p.intent === 'transaction' && p.transaction) {
      const t = p.transaction;
      if (
        t.type &&
        t.amount > 0 &&
        t.description &&
        t.category &&
        t.status &&
        /^\d{4}-\d{2}-\d{2}$/.test(t.date)
      ) {
        return { kind: 'transaction', transaction: t };
      }
      return { kind: 'unknown', reason: 'campos da transação faltando' };
    }
    if (p.intent === 'report' && p.period) {
      return { kind: 'report', period: p.period };
    }
    if (p.intent === 'help') return { kind: 'help' };
    return { kind: 'unknown', reason: p.reason };
  } catch (e: any) {
    return { kind: 'unknown', reason: `JSON inválido: ${e.message}` };
  }
}

export async function transcribeAudio(
  base64: string,
  mimeType: string,
): Promise<string | null> {
  if (!geminiEnabled) return null;
  return await callGemini({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Transcreva este áudio em pt-BR. Retorne SOMENTE o texto transcrito, sem comentários.',
          },
          { inlineData: { mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.0 },
  });
}

export async function extractFromReceipt(
  base64: string,
  mimeType: string,
  allowedCategories: string[],
): Promise<Intent> {
  if (!geminiEnabled) return { kind: 'unknown', reason: 'gemini desligado' };
  const today = new Date().toISOString().split('T')[0];
  const text = await callGemini({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Foto enviada via WhatsApp.
Se for comprovante de pagamento, nota fiscal, recibo ou tela de PIX, extraia uma transação no JSON do schema.
Se não for, retorne intent="unknown" com razão curta.
Categorias permitidas: ${allowedCategories.join(', ')}
Hoje: ${today}`,
          },
          { inlineData: { mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA_RECEIPT,
    },
  });
  if (!text) return { kind: 'unknown', reason: 'sem resposta do gemini' };
  return parseIntentJson(text);
}
