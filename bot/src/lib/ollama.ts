// Ollama + whisper.cpp provider: local, free, no API key.
//
// Texto/JSON e visão usam Ollama (`/api/chat` com structured outputs).
// Áudio usa whisper-cli (binário do brew `whisper-cpp`) via subprocess.
//
// Envs:
//   OLLAMA_BASE_URL       default http://localhost:11434
//   OLLAMA_TEXT_MODEL     default qwen2.5vl:7b   (mesmo modelo serve texto+visão)
//   OLLAMA_VISION_MODEL   default = OLLAMA_TEXT_MODEL
//   WHISPER_BIN           default whisper-cli
//   WHISPER_MODEL_PATH    default ./models/ggml-large-v3-turbo-q5_0.bin
//   WHISPER_THREADS       default 8

import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Buffer } from 'node:buffer';

import type {
  Intent,
  ParsedTransaction,
  ParsedDebt,
  ParsedRecurringBill,
  ReportPeriod,
} from './ai-types.js';
import { getPrompt } from './prompts.js';
export type {
  Intent,
  ParsedTransaction,
  ParsedDebt,
  ParsedRecurringBill,
  ReportPeriod,
} from './ai-types.js';

const BASE_URL = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(
  /\/$/,
  '',
);
const TEXT_MODEL = process.env.OLLAMA_TEXT_MODEL ?? 'qwen2.5vl:7b';
const VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? TEXT_MODEL;
const WHISPER_BIN = process.env.WHISPER_BIN ?? 'whisper-cli';
const WHISPER_MODEL_PATH =
  process.env.WHISPER_MODEL_PATH ?? './models/ggml-large-v3-turbo-q5_0.bin';
const WHISPER_THREADS = Number(process.env.WHISPER_THREADS ?? 8);

// Provider sempre considerado "ligado" — falhas viram erros em runtime,
// não silenciamos como o gemini fazia ausente API_KEY.
export const ollamaEnabled = true;

// ── JSON schemas (Ollama 0.5+ aceita format: <json-schema>) ────────────────

const SCHEMA_TRANSACTION = {
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
  required: ['type', 'description', 'amount', 'category', 'status', 'date'],
} as const;

const SCHEMA_DEBT = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    totalAmount: { type: 'number' },
    installments: { type: 'number' },
    installmentAmount: { type: 'number' },
    dueDate: { type: 'string' },
  },
  required: [
    'description',
    'totalAmount',
    'installments',
    'installmentAmount',
    'dueDate',
  ],
} as const;

const SCHEMA_RECURRING_BILL = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    amount: { type: 'number' },
    category: { type: 'string' },
    type: { type: 'string', enum: ['income', 'expense'] },
    dueDay: { type: 'number' },
  },
  required: ['description', 'amount', 'category', 'type', 'dueDay'],
} as const;

const SCHEMA_INTENT = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      enum: [
        'transaction',
        'debt',
        'recurring_bill',
        'report',
        'help',
        'unknown',
      ],
    },
    reason: { type: 'string' },
    transaction: SCHEMA_TRANSACTION,
    debt: SCHEMA_DEBT,
    recurringBill: SCHEMA_RECURRING_BILL,
    period: { type: 'string', enum: ['today', 'week', 'month', 'year'] },
  },
  required: ['intent'],
} as const;

const SCHEMA_RECEIPT = {
  type: 'object',
  properties: {
    intent: { type: 'string', enum: ['transaction', 'unknown'] },
    reason: { type: 'string' },
    transaction: SCHEMA_TRANSACTION,
  },
  required: ['intent'],
} as const;

// ── HTTP helper ────────────────────────────────────────────────────────────

interface OllamaChatBody {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    images?: string[];
  }>;
  stream: false;
  format?: unknown;
  options?: { temperature?: number; num_ctx?: number };
}

interface OllamaChatResp {
  message?: { content?: string };
  error?: string;
}

async function ollamaChat(body: OllamaChatBody): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(
        `[ollama] HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`,
      );
      return null;
    }
    const data = (await res.json()) as OllamaChatResp;
    if (data.error) {
      console.error(`[ollama] error: ${data.error}`);
      return null;
    }
    return data.message?.content ?? null;
  } catch (e: any) {
    console.error(`[ollama] fetch failed: ${e?.message ?? e}`);
    return null;
  }
}

// ── prompts (fallbacks usados quando Supabase está off ou sem registro) ──

const fallbackIntentPrompt = (allowedCategories: string[], today: string) => `
Você é um parser de mensagens de WhatsApp em pt-BR para o app Finzap (controle financeiro pessoal).
Hoje é ${today}.

# Intenções (escolha UMA)
- "transaction"     — gasto ou receita única já realizada (ou prevista pra agora)
- "debt"            — dívida parcelada com vários pagamentos futuros
- "recurring_bill"  — conta FIXA mensal que se repete (aluguel, Netflix, luz)
- "report"          — pedir saldo, resumo, extrato
- "help"            — "ajuda", "?", "como usar", "comandos"
- "unknown"         — qualquer outra coisa

# Quando for "transaction"

## type
- "expense": "gastei", "paguei", "comprei", "saiu", "débito", "fatura", "torrei", "devo"
- "income":  "recebi", "ganhei", "caiu (na conta)", "salário", "freelance", "pix recebido", "venda"

## description (REGRA IMPORTANTE)
**É O QUE foi comprado ou de onde veio o dinheiro — NUNCA o verbo da ação.**
Pegue o substantivo principal (loja, item, pagador). Tire artigos ("o", "a", "no", "na", "do", "da").
2 a 6 palavras, minúsculas, sem pontuação no final.

Exemplos:
- "gastei 50 no mercado"        → description: "mercado"
- "paguei 30 de uber"           → description: "uber"
- "comprei tênis por 250"       → description: "tênis"
- "almoço 35 reais"             → description: "almoço"
- "30 no posto ipiranga"        → description: "posto ipiranga"
- "recebi salário 5000"         → description: "salário"
- "caiu 200 do freela do joão"  → description: "freela do joão"
- "netflix 55"                  → description: "netflix"

## amount (em reais, número, sem símbolo)
- "R$ 1.500,50" → 1500.50
- "50 reais"   → 50
- "3k"         → 3000
- "vinte"      → 20
- "meia"       → 50  (gíria de "cinquenta")

## category (slug em pt-BR, sem acento, sem espaço — use _ se precisar)
Categorias já cadastradas: ${allowedCategories.join(', ')}.
Use uma delas SE encaixar. Se NENHUMA delas descrever bem o gasto, **invente
uma nova categoria** com slug significativo (ex: "pets", "academia",
"educacao", "doacoes", "presentes", "viagem"). O sistema cria automático.

Mapeamento típico:
- mercado, supermercado, padaria, açougue, feira → alimentacao
- restaurante, almoço, jantar, lanche, ifood, rappi → alimentacao
- uber, 99, taxi, ônibus, metrô, posto, gasolina, combustível → transporte
- aluguel, condomínio, luz, água, internet, gás → moradia
- farmácia, médico, dentista, plano de saúde → saude
- cinema, bar, balada, show, ingresso, netflix, spotify → lazer
- roupa, sapato, tênis, perfume, presente → compras
- salário, freela, pix recebido, venda → salario (se for income)
- ração, pet shop, vacina cachorro → pets (cria nova)
- academia, crossfit, personal → academia (cria nova)
- escola, faculdade, curso → educacao (cria nova)

## status (REGRA IMPORTANTE — decida pelo TEMPO do verbo)
- **"pago"**     — gasto JÁ FEITO. Verbo no passado: gastei, paguei, comprei, saiu, recebi (verbo no passado + expense).
- **"recebido"** — receita JÁ ENTROU. "recebi", "ganhei", "caiu na conta", "pix recebido".
- **"a_pagar"**  — vai pagar no futuro. "vou pagar", "preciso pagar", "amanhã pago", "fatura X vence dia Y".
- **"a_receber"** — vai receber no futuro. "vou receber", "vai entrar", "salário cai dia 5".

Padrão (default):
- expense + verbo no passado → "pago"
- income  + verbo no passado → "recebido"
- expense + futuro/presente → "a_pagar"
- income  + futuro/presente → "a_receber"

## date
YYYY-MM-DD. Hoje = ${today} se a mensagem não disser data.
"ontem" → ${today} − 1 dia. "hoje" → ${today}. "amanhã" → ${today} + 1.
"sexta passada" / "dia 15" / etc — interprete a data calendário.

# Quando for "debt"
Use quando a mensagem fala de COMPRA PARCELADA ou DÍVIDA com várias parcelas.
Sinais: "comprei em Nx", "parcelei", "dívida de", "ainda devo", "financiei", "X vezes de Y".
Devolva debt com:
- description: o que foi comprado/devido (loja, item, motivo)
- totalAmount: valor total da dívida (em reais)
- installments: número de parcelas
- installmentAmount: valor de cada parcela (totalAmount / installments)
- dueDate: data da próxima parcela em YYYY-MM-DD (use o dia mencionado ou ${today} se não disser)

Exemplos:
- "parcelei tênis em 6x de 80"   → totalAmount=480, installments=6, installmentAmount=80
- "comprei celular 3000 em 12x"  → totalAmount=3000, installments=12, installmentAmount=250
- "dívida de 1500 com a maria"   → totalAmount=1500, installments=1, installmentAmount=1500

# Quando for "recurring_bill"
Use quando a mensagem fala de conta FIXA MENSAL que se repete (não um pagamento único).
Sinais: "minha conta de", "todo mês", "todo dia X", "mensal", "Netflix", "aluguel", "luz mensal".
Devolva recurringBill com:
- description: nome da conta
- amount: valor mensal
- category: mesmas regras das transactions
- type: "expense" para conta a pagar, "income" para receita recorrente (raro)
- dueDay: dia do vencimento (1-31; se não souber, use 5)

Exemplos:
- "aluguel 1500 todo dia 10"            → amount=1500, dueDay=10, category=moradia
- "netflix 55 mensal"                    → amount=55, dueDay=5 (default), category=lazer
- "internet 120 dia 15"                  → amount=120, dueDay=15, category=moradia
- "salário cai todo dia 5 — 5000"        → amount=5000, dueDay=5, type=income, category=salario

DIFERENÇA crítica:
- "paguei aluguel 1500 hoje"   → transaction (já pagou agora)
- "aluguel 1500 todo dia 10"   → recurring_bill (conta fixa, repete todo mês)
- "comprei tv em 10x"           → debt (parcelado, vários pagamentos)
- "tv 200 reais"                → transaction (compra única)

# Quando for "report"
period = "today" | "week" | "month" | "year".
- "hoje", "do dia"           → today
- "essa semana", "semanal"   → week
- "do mês", "esse mês", "saldo" (sem qualificador) → month
- "do ano", "esse ano"       → year

# Regras gerais
- Se a mensagem é só uma saudação ("oi", "tudo bem?") sem ação → "unknown".
- Se faltar campo obrigatório (amount sem número, descrição vazia) → "unknown" com razão curta.
- Responda SOMENTE o JSON, sem markdown, sem comentários.

# Exemplos completos

Mensagem: "gastei 99 na padaria"
Saída: {"intent":"transaction","transaction":{"type":"expense","description":"padaria","amount":99,"category":"alimentacao","status":"pago","date":"${today}"}}

Mensagem: "caiu 3000 do salário"
Saída: {"intent":"transaction","transaction":{"type":"income","description":"salário","amount":3000,"category":"salario","status":"recebido","date":"${today}"}}

Mensagem: "amanhã preciso pagar 200 da luz"
Saída: {"intent":"transaction","transaction":{"type":"expense","description":"luz","amount":200,"category":"moradia","status":"a_pagar","date":"<amanhã>"}}

Mensagem: "saldo do mês"
Saída: {"intent":"report","period":"month"}

Mensagem: "como funciona?"
Saída: {"intent":"help"}
`.trim();

// ── parsing ────────────────────────────────────────────────────────────────

function parseIntentJson(raw: string): Intent {
  try {
    const p = JSON.parse(raw) as {
      intent:
        | 'transaction'
        | 'debt'
        | 'recurring_bill'
        | 'report'
        | 'help'
        | 'unknown';
      reason?: string;
      transaction?: ParsedTransaction;
      debt?: ParsedDebt;
      recurringBill?: ParsedRecurringBill;
      period?: ReportPeriod;
    };
    if (p.intent === 'transaction' && p.transaction) {
      const t = p.transaction;
      if (
        t.type &&
        typeof t.amount === 'number' &&
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
    if (p.intent === 'debt' && p.debt) {
      const d = p.debt;
      if (
        d.description &&
        typeof d.totalAmount === 'number' &&
        d.totalAmount > 0 &&
        Number.isInteger(d.installments) &&
        d.installments > 0 &&
        typeof d.installmentAmount === 'number' &&
        d.installmentAmount > 0 &&
        /^\d{4}-\d{2}-\d{2}$/.test(d.dueDate)
      ) {
        return { kind: 'debt', debt: d };
      }
      return { kind: 'unknown', reason: 'campos da dívida faltando' };
    }
    if (p.intent === 'recurring_bill' && p.recurringBill) {
      const r = p.recurringBill;
      if (
        r.description &&
        typeof r.amount === 'number' &&
        r.amount > 0 &&
        r.category &&
        r.type &&
        Number.isInteger(r.dueDay) &&
        r.dueDay >= 1 &&
        r.dueDay <= 31
      ) {
        return { kind: 'recurring_bill', recurringBill: r };
      }
      return { kind: 'unknown', reason: 'campos da conta fixa faltando' };
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

// ── public API ─────────────────────────────────────────────────────────────

export async function parseIntent(
  message: string,
  allowedCategories: string[],
): Promise<Intent> {
  const today = new Date().toISOString().split('T')[0];
  const fallback = fallbackIntentPrompt(allowedCategories, today);
  const prompt = await getPrompt(
    'intent_parser',
    { today, categories: allowedCategories.join(', ') },
    fallback,
  );
  const text = await ollamaChat({
    model: prompt.model ?? TEXT_MODEL,
    stream: false,
    format: SCHEMA_INTENT,
    options: {
      temperature: prompt.temperature ?? 0.2,
      num_ctx: 4096,
    },
    messages: [
      { role: 'system', content: prompt.content },
      { role: 'user', content: `Mensagem: """${message}"""` },
    ],
  });
  if (!text) return { kind: 'unknown', reason: 'sem resposta do ollama' };
  return parseIntentJson(text);
}

const fallbackReceiptPrompt = (allowedCategories: string[], today: string) =>
  `Você está olhando uma FOTO no app Finzap (controle financeiro pessoal).

# REGRA SIMPLES
Se a foto MOSTRA UM VALOR EM REAIS (R$ X,XX) e o nome/loja envolvido na transação,
é UMA TRANSAÇÃO FINANCEIRA → retorne intent="transaction".

Inclui (TODOS são transação):
✓ PIX enviado, PIX recebido, comprovante PIX, "Você transferiu", "Você recebeu"
✓ Comprovante de pagamento (cartão, débito, crédito, boleto)
✓ Nota fiscal, cupom fiscal, recibo
✓ Tela de extrato bancário com transação destacada
✓ Tela de fatura, boleto pago

Apenas retorne intent="unknown" se a foto NÃO TIVER valor financeiro:
✗ Selfie, paisagem, meme, conversa de texto, foto de objeto sem preço

# Income vs expense
- "Você transferiu", "valor pago", "débito", "saída" → expense
- "Você recebeu", "crédito", "entrada", "transferência recebida" → income
- Cupom fiscal / nota fiscal de compra → expense
- Boleto pago → expense

# Campos
- description: nome do estabelecimento ou contraparte (Ex: "Pamonha Super Quente", "Maria Silva", "Posto Ipiranga"). 2-6 palavras. Sem CNPJ, sem números longos.
- amount: valor em reais como número (21.00, 1500.50)
- category: slug pt-BR sem acento. Já cadastradas: ${allowedCategories.join(', ')}. Se nenhuma encaixar, **invente um slug novo** (ex: "pets", "doacoes"). NÃO use "outros" se você consegue inferir um melhor.
- type: "expense" | "income"
- status: "pago" (expense concluída) | "recebido" (income concluída) — comprovante quase sempre = concluído
- date: YYYY-MM-DD. Da imagem se aparecer; senão ${today}.

Responda SOMENTE o JSON, sem markdown, sem texto extra.`;

export async function extractFromReceipt(
  base64: string,
  _mimeType: string,
  allowedCategories: string[],
): Promise<Intent> {
  const today = new Date().toISOString().split('T')[0];
  const fallback = fallbackReceiptPrompt(allowedCategories, today);
  const prompt = await getPrompt(
    'receipt_extractor',
    { today, categories: allowedCategories.join(', ') },
    fallback,
  );

  const text = await ollamaChat({
    model: prompt.model ?? VISION_MODEL,
    stream: false,
    format: SCHEMA_RECEIPT,
    options: {
      temperature: prompt.temperature ?? 0.1,
      num_ctx: 8192,
    },
    messages: [{ role: 'user', content: prompt.content, images: [base64] }],
  });
  if (!text) return { kind: 'unknown', reason: 'sem resposta do ollama' };
  return parseIntentJson(text);
}

// ── audio (whisper.cpp) ────────────────────────────────────────────────────

function mimeToExt(mime: string): string {
  const m: Record<string, string> = {
    'audio/ogg': 'ogg',
    'audio/ogg; codecs=opus': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
  };
  return m[mime] ?? 'ogg';
}

function run(
  cmd: string,
  args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d.toString()));
    p.stderr.on('data', (d) => (stderr += d.toString()));
    p.on('error', reject);
    p.on('close', (code) =>
      resolve({ code: code ?? -1, stdout, stderr }),
    );
  });
}

export async function transcribeAudio(
  base64: string,
  mimeType: string,
): Promise<string | null> {
  const dir = await mkdtemp(path.join(tmpdir(), 'finzap-audio-'));
  const inFile = path.join(dir, `in.${mimeToExt(mimeType)}`);
  const wavFile = path.join(dir, 'in.wav');
  try {
    await writeFile(inFile, Buffer.from(base64, 'base64'));

    // whisper.cpp aceita só wav 16kHz 16-bit mono.
    const ff = await run('ffmpeg', [
      '-y',
      '-i',
      inFile,
      '-ar',
      '16000',
      '-ac',
      '1',
      '-c:a',
      'pcm_s16le',
      wavFile,
    ]);
    if (ff.code !== 0) {
      console.error(`[whisper] ffmpeg falhou: ${ff.stderr.slice(0, 300)}`);
      return null;
    }

    const wh = await run(WHISPER_BIN, [
      '-m',
      WHISPER_MODEL_PATH,
      '-l',
      'pt',
      '-t',
      String(WHISPER_THREADS),
      '-otxt',
      '-of',
      path.join(dir, 'out'),
      '-nt', // no timestamps
      wavFile,
    ]);
    if (wh.code !== 0) {
      console.error(`[whisper] cli falhou: ${wh.stderr.slice(0, 300)}`);
      return null;
    }
    const txt = await readFile(path.join(dir, 'out.txt'), 'utf8');
    return txt.trim() || null;
  } catch (e: any) {
    console.error(`[whisper] erro: ${e?.message ?? e}`);
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

