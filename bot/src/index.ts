// Finzap WhatsApp bot (local).
//
// Pipeline:
//   1. Recebe webhook da Evolution API.
//   2. Identifica usuário pelo número (whatsapp_phone_e164 == remoteJid).
//   3. Texto: parseIntent (Gemini) → registra transação ou gera relatório.
//   4. Áudio: transcribe (Gemini) → mesmo fluxo do texto.
//   5. Foto:  extractFromReceipt (Gemini vision) → registra se for comprovante.
//   6. Sempre responde no WhatsApp confirmando o que entendeu.

import express, { type Request, type Response } from 'express';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Buffer } from 'node:buffer';

import {
  findUserByPhone,
  insertTransaction,
  insertDebt,
  insertRecurringBill,
  ensureCategory,
  listCategories,
  getSummary,
  type BotUser,
} from './lib/supabase.js';
import {
  parseIntent,
  transcribeAudio,
  extractFromReceipt,
  ollamaEnabled as aiEnabled,
} from './lib/ollama.js';
import type {
  ParsedTransaction,
  ParsedDebt,
  ParsedRecurringBill,
  ReportPeriod,
} from './lib/ai-types.js';
import {
  humanizeTransaction,
  humanizeDebt,
  humanizeRecurringBill,
  humanizeReport,
  humanizeUnknown,
  humanizeUnregistered,
  humanizeAudioTranscript,
  humanizeHelp,
  humanizeError,
} from './lib/humanizer.js';

const PORT = Number(process.env.BOT_PORT ?? 3001);
const EVO_URL = (process.env.EVOLUTION_API_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
);
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? '';
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE ?? 'dev';
const MEDIA_DIR = process.env.MEDIA_DIR ?? './media';

/**
 * Whitelist de números (E.164 sem '+'). Comma-separated.
 * Vazio ou unset → ninguém recebe resposta. Modo dev fail-safe.
 * Em prod você pode desativar deixando "*" (libera qualquer usuário cadastrado).
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}
const ALLOWED_RAW = (process.env.BOT_ALLOWED_PHONES ?? '').trim();
const ALLOW_ANY = ALLOWED_RAW === '*';
const ALLOWED_PHONES = new Set(
  ALLOWED_RAW
    .split(',')
    .map((s) => normalizePhone(s))
    .filter((s) => s.length >= 10),
);

// ── helpers ────────────────────────────────────────────────────────────────

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });

function jidToPhone(jid: string): string {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '');
}

// Marca visível que prefixa toda resposta do bot (3 emojis em sequência
// improvável de aparecer em mensagem de usuário).
// Usada pra detectar echo em self-chat e não cair em loop.
const BOT_MARKER = '🤖💰📊';

async function sendText(jid: string, text: string): Promise<void> {
  const number = jidToPhone(jid);
  const res = await fetch(
    `${EVO_URL}/message/sendText/${encodeURIComponent(EVO_INSTANCE)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
      body: JSON.stringify({ number, text: BOT_MARKER + text }),
    },
  );
  if (!res.ok) {
    console.error(
      `[bot] reply send failed ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  }
}

async function downloadMedia(
  messageId: string,
): Promise<{ base64: string; mimetype: string } | null> {
  const url = `${EVO_URL}/chat/getBase64FromMediaMessage/${encodeURIComponent(EVO_INSTANCE)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
    body: JSON.stringify({
      message: { key: { id: messageId } },
      convertToMp4: false,
    }),
  });
  if (!res.ok) {
    console.error(
      `[bot] media download failed ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
    return null;
  }
  const data = (await res.json()) as { base64?: string; mimetype?: string };
  if (!data.base64) return null;
  return {
    base64: data.base64,
    mimetype: data.mimetype ?? 'application/octet-stream',
  };
}

function extOf(mime: string): string {
  const m: Record<string, string> = {
    'audio/ogg': 'ogg',
    'audio/ogg; codecs=opus': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'application/pdf': 'pdf',
  };
  return m[mime] ?? 'bin';
}

async function saveBase64(prefix: string, base64: string, mime: string) {
  await mkdir(MEDIA_DIR, { recursive: true });
  const f = path.join(MEDIA_DIR, `${prefix}-${Date.now()}.${extOf(mime)}`);
  await writeFile(f, Buffer.from(base64, 'base64'));
  return f;
}

function rangeFor(period: ReportPeriod): { from: Date; to: Date; label: string } {
  const to = new Date();
  const from = new Date(to);
  let label: string;
  switch (period) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      label = 'hoje';
      break;
    case 'week':
      from.setDate(to.getDate() - 6);
      label = 'últimos 7 dias';
      break;
    case 'year':
      from.setFullYear(to.getFullYear(), 0, 1);
      label = 'este ano';
      break;
    case 'month':
    default:
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      label = 'este mês';
      break;
  }
  return { from, to, label };
}

// (formatReport e HELP_TEXT antigos removidos — substituídos por
// humanizeReport e humanizeHelp em ./lib/humanizer.js)

const _LEGACY_HELP_TEXT_UNUSED = [
  '🤖 *Finzap — comandos*',
  '',
  '✏️  *Cadastrar gasto:* "gastei 50 no mercado"',
  '💰  *Cadastrar receita:* "recebi salário 5000"',
  '🎤  *Áudio:* fala normal, eu transcrevo',
  '📸  *Foto:* manda comprovante/PIX que eu extraio',
  '',
  '📊  *Saldo do mês:* "resumo do mês" ou "saldo"',
  '📅  *Outros períodos:* "hoje", "essa semana", "esse ano"',
  '',
  '_Para parar de receber, responda SAIR._',
].join('\n');

// ── core ───────────────────────────────────────────────────────────────────

async function handleTransactionIntent(
  user: BotUser,
  jid: string,
  tx: ParsedTransaction,
) {
  // garante categoria — cria se não existir
  const finalCategory = await ensureCategory(user.account_id, tx.category);
  const txFinal = { ...tx, category: finalCategory };
  const result = await insertTransaction(user.account_id, txFinal);
  if (!result.ok) {
    await sendText(jid, humanizeError(result.error ?? 'erro desconhecido'));
    return;
  }
  await sendText(jid, humanizeTransaction(user.name, txFinal));
}

async function handleDebtIntent(
  user: BotUser,
  jid: string,
  d: ParsedDebt,
) {
  const result = await insertDebt(user.account_id, {
    description: d.description,
    total_amount: d.totalAmount,
    installments: d.installments,
    installment_amount: d.installmentAmount,
    paid_installments: 0,
    status: 'a_pagar',
    due_date: d.dueDate,
  });
  if (!result.ok) {
    await sendText(jid, humanizeError(result.error ?? 'erro desconhecido'));
    return;
  }
  await sendText(jid, humanizeDebt(user.name, d));
}

async function handleRecurringBillIntent(
  user: BotUser,
  jid: string,
  r: ParsedRecurringBill,
) {
  const finalCategory = await ensureCategory(user.account_id, r.category);
  const result = await insertRecurringBill(user.account_id, {
    description: r.description,
    amount: r.amount,
    category: finalCategory,
    type: r.type,
    due_day: r.dueDay,
    is_active: true,
  });
  if (!result.ok) {
    await sendText(jid, humanizeError(result.error ?? 'erro desconhecido'));
    return;
  }
  await sendText(
    jid,
    humanizeRecurringBill(user.name, { ...r, category: finalCategory }),
  );
}

async function handleReportIntent(
  user: BotUser,
  jid: string,
  period: ReportPeriod,
) {
  const { from, to, label } = rangeFor(period);
  const summary = await getSummary(user.account_id, from, to);
  await sendText(jid, humanizeReport(user.name, label, summary));
}

async function processText(user: BotUser, jid: string, text: string) {
  const cats = await listCategories(user.account_id);
  const intent = await parseIntent(text, cats);
  console.log(`[bot] intent kind=${intent.kind}`);
  if (intent.kind === 'transaction') {
    return handleTransactionIntent(user, jid, intent.transaction);
  }
  if (intent.kind === 'debt') {
    return handleDebtIntent(user, jid, intent.debt);
  }
  if (intent.kind === 'recurring_bill') {
    return handleRecurringBillIntent(user, jid, intent.recurringBill);
  }
  if (intent.kind === 'report') {
    return handleReportIntent(user, jid, intent.period);
  }
  if (intent.kind === 'help') {
    return sendText(jid, humanizeHelp(user.name));
  }
  await sendText(jid, humanizeUnknown(user.name));
}

async function processAudio(
  user: BotUser,
  jid: string,
  messageId: string,
  mimetype: string,
) {
  if (!aiEnabled) {
    await sendText(
      jid,
      '🎤 Recebi seu áudio mas o Gemini não está configurado neste bot. Me mande por texto.',
    );
    return;
  }
  const media = await downloadMedia(messageId);
  if (!media) {
    await sendText(jid, '🎤 Recebi o áudio mas falhou o download. Tenta de novo?');
    return;
  }
  await saveBase64('audio', media.base64, media.mimetype);
  const transcript = await transcribeAudio(media.base64, media.mimetype);
  if (!transcript) {
    await sendText(jid, '🎤 Não consegui transcrever o áudio. Manda em texto?');
    return;
  }
  console.log(`[bot] audio transcrito: "${transcript.slice(0, 100)}"`);
  await sendText(jid, humanizeAudioTranscript(transcript));
  await processText(user, jid, transcript);
}

async function processImage(
  user: BotUser,
  jid: string,
  messageId: string,
  caption: string | undefined,
) {
  if (!aiEnabled) {
    await sendText(
      jid,
      '📸 Recebi a foto mas o Gemini não está configurado. Me manda por texto o valor?',
    );
    return;
  }
  const media = await downloadMedia(messageId);
  if (!media) {
    await sendText(jid, '📸 Não consegui baixar a foto. Reenvia?');
    return;
  }
  await saveBase64('image', media.base64, media.mimetype);
  const cats = await listCategories(user.account_id);
  const intent = await extractFromReceipt(media.base64, media.mimetype, cats);
  console.log(`[bot] receipt intent kind=${intent.kind}`);
  if (intent.kind === 'transaction') {
    await sendText(jid, `📸 Identifiquei um comprovante. Registrando...`);
    return handleTransactionIntent(user, jid, intent.transaction);
  }
  if (intent.kind === 'debt') {
    await sendText(jid, `📸 Comprovante de parcelamento identificado.`);
    return handleDebtIntent(user, jid, intent.debt);
  }
  // imagem genérica ou caption manual
  if (caption && caption.trim()) {
    return processText(user, jid, caption);
  }
  const reason = intent.kind === 'unknown' ? intent.reason : undefined;
  await sendText(
    jid,
    [
      '📸 Recebi a foto mas não parece comprovante.',
      reason ? `(${reason})` : '',
      '',
      'Se for um gasto, escreve em texto: ex. "gastei 50 no mercado".',
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

// ── webhook ────────────────────────────────────────────────────────────────

interface WebhookBody {
  event?: string;
  instance?: string;
  data?: any;
}

async function handleMessageUpsert(payload: WebhookBody) {
  const data = payload.data ?? {};
  const remoteJid: string | undefined = data?.key?.remoteJid;
  const messageId: string | undefined = data?.key?.id;
  if (!remoteJid || !messageId) return;

  // fromMe = true em duas situações:
  //   (a) eco da própria resposta do bot — TEXTO começando com BOT_MARKER → ignora
  //   (b) user mandou de si pra si (self-chat) → processa normalmente
  //
  // Bot só envia TEXTO (nunca envia áudio/foto/vídeo). Logo:
  //   - fromMe + áudio  → SEMPRE é o usuário gravando em self-chat
  //   - fromMe + foto   → SEMPRE é o usuário enviando em self-chat
  //   - fromMe + texto  → pode ser eco do bot OU self-chat → checa marker
  if (data?.key?.fromMe) {
    const hasMedia = !!(
      data?.message?.audioMessage ||
      data?.message?.imageMessage ||
      data?.message?.videoMessage ||
      data?.message?.documentMessage
    );
    if (!hasMedia) {
      const msgText: string =
        data?.message?.conversation ??
        data?.message?.extendedTextMessage?.text ??
        '';
      if (!msgText || msgText.startsWith(BOT_MARKER)) {
        return;
      }
    }
    // chega aqui = usuário falando consigo mesmo no Mensagens próprias.
  }

  // Camada 1: só conversa 1:1.
  if (
    remoteJid.endsWith('@g.us') ||
    remoteJid.endsWith('@broadcast') ||
    remoteJid.endsWith('@newsletter') ||
    !remoteJid.includes('@')
  ) {
    console.log(`[bot] ignorando jid não-pessoal: ${remoteJid}`);
    return;
  }

  // Camada 2: allow-list explícita por telefone. Sem allow-list (vazio) =
  // ninguém recebe resposta. "*" libera qualquer um cadastrado.
  const phone = jidToPhone(remoteJid);
  if (!ALLOW_ANY) {
    if (ALLOWED_PHONES.size === 0) {
      console.log(
        `[bot] BOT_ALLOWED_PHONES vazio — não respondendo a ${phone}`,
      );
      return;
    }
    if (!ALLOWED_PHONES.has(phone)) {
      console.log(`[bot] número fora da allow-list: ${phone}`);
      return;
    }
  }

  const user = await findUserByPhone(phone);
  if (!user) {
    await sendText(remoteJid, humanizeUnregistered(phone));
    return;
  }

  const msg = data.message ?? {};

  // opt-out
  const text =
    msg.conversation ?? msg.extendedTextMessage?.text ?? '';
  if (typeof text === 'string' && text.trim().toUpperCase() === 'SAIR') {
    await sendText(
      remoteJid,
      `Beleza, parei por aqui${user.name ? `, ${user.name.split(' ')[0]}` : ''}. Quando quiser voltar, é só reativar no app. 👋`,
    );
    return;
  }

  // text
  if (msg.conversation || msg.extendedTextMessage?.text) {
    return processText(user, remoteJid, text);
  }
  // audio
  if (msg.audioMessage) {
    return processAudio(
      user,
      remoteJid,
      messageId,
      msg.audioMessage.mimetype ?? 'audio/ogg',
    );
  }
  // image
  if (msg.imageMessage) {
    return processImage(
      user,
      remoteJid,
      messageId,
      msg.imageMessage.caption,
    );
  }
  // video
  if (msg.videoMessage) {
    await sendText(
      remoteJid,
      '🎬 Vídeo ainda não é processado. Manda foto do comprovante ou texto?',
    );
    return;
  }
  // document/sticker/etc
  await sendText(
    remoteJid,
    '🤔 Recebi um tipo de mídia que ainda não processo. Manda texto, áudio ou foto.',
  );
}

const app = express();
app.use(express.json({ limit: '50mb' }));

app.get('/healthz', (_req, res) => {
  res.status(200).json({
    ok: true,
    instance: EVO_INSTANCE,
    ai: aiEnabled ? 'ollama' : 'off',
  });
});

app.post('/webhook', async (req: Request, res: Response) => {
  res.status(200).send('ok');
  const body = req.body as WebhookBody;
  console.log(`[bot] event=${body.event} instance=${body.instance ?? '-'}`);
  try {
    if (body.event === 'messages.upsert') {
      await handleMessageUpsert(body);
    } else if (body.event === 'connection.update') {
      console.log('[bot] connection state:', body.data?.state ?? body.data);
    } else if (body.event === 'qrcode.updated') {
      console.log('[bot] novo QR disponível em http://localhost:8080/manager');
    }
  } catch (err: any) {
    console.error('[bot] handler error', err?.message ?? err);
  }
});

app.listen(PORT, () => {
  console.log(`[bot] listening on :${PORT}`);
  console.log(`[bot] instance=${EVO_INSTANCE} evolution=${EVO_URL}`);
  console.log(`[bot] ai=${aiEnabled ? 'ollama (qwen2.5vl) + whisper-cli' : 'off'}`);
  if (ALLOW_ANY) {
    console.log('[bot] allow-list: * (qualquer usuário cadastrado)');
  } else if (ALLOWED_PHONES.size === 0) {
    console.warn(
      '[bot] allow-list VAZIA — bot não responderá a ninguém. Configure BOT_ALLOWED_PHONES.',
    );
  } else {
    console.log(
      `[bot] allow-list: ${Array.from(ALLOWED_PHONES).join(', ')}`,
    );
  }
});
