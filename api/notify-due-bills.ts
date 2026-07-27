/**
 * Cron da Vercel — notifica contas a vencer / vencendo hoje / vencidas.
 *
 * REGRAS (pedido do usuário):
 *   • Avisa 1 dia antes (a vencer), no dia (a pagar) e após o vencimento (vencida).
 *   • Só dispara em horário comercial: 08h–18h (America/Sao_Paulo).
 *   • No máximo 3x por dia por conta, até o usuário marcar como paga.
 *
 * O agendamento (vercel.json) roda 3x dentro do horário comercial. O contador
 * diário em users/{uid}/notificationLog/{yyyy-MM-dd} garante o teto de 3, mesmo
 * que o cron seja invocado mais vezes. "Parar ao pagar" é automático: contas
 * pagas saem das queries (status != a_pagar / status pago).
 *
 * Fontes de "conta a pagar com vencimento":
 *   • debts        → dueDate + parcelas (próxima parcela não paga)
 *   • transactions → status 'a_pagar' (type expense), com `date` = vencimento
 * ambas em users/{uid}/accounts/{personal|business}/...
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import webpush from 'web-push';
import { addMonths, differenceInCalendarDays } from 'date-fns';

const ACCOUNT_TYPES = ['personal', 'business'] as const;
const MAX_PER_DAY = 3;
const BUSINESS_START = 8; // 08h
const BUSINESS_END = 18; // até 18h (exclusivo)

function initAdmin() {
  if (getApps().length) return;
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

/** Data/hora "agora" no fuso America/Sao_Paulo. */
function nowSaoPaulo(): { dateStr: string; hour: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
  const hour = parseInt(parts.hour, 10);
  return { dateStr, hour };
}

/** Normaliza um valor de data (yyyy-MM-dd ou ISO) para a data-calendário BRT. */
function toBrtDateStr(value: string): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Date "seguro" (meio-dia UTC) a partir de yyyy-MM-dd, pra comparar dias. */
function dayDate(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T12:00:00Z`);
}

type Bucket = 'a_vencer' | 'hoje' | 'vencida';

/** Classifica um vencimento vs hoje. null = ainda não relevante (>1 dia). */
function classify(dueStr: string, todayStr: string): { bucket: Bucket; diff: number } | null {
  const diff = differenceInCalendarDays(dayDate(dueStr), dayDate(todayStr));
  if (diff === 1) return { bucket: 'a_vencer', diff };
  if (diff === 0) return { bucket: 'hoje', diff };
  if (diff < 0) return { bucket: 'vencida', diff };
  return null; // vence em 2+ dias → ainda não avisa
}

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function buildMessage(bucket: Bucket, diff: number, desc: string, amount: number) {
  if (bucket === 'a_vencer') {
    return { title: '🔔 Conta a vencer amanhã', body: `${desc} — ${brl(amount)} vence amanhã.` };
  }
  if (bucket === 'hoje') {
    return { title: '🔔 Conta vence hoje', body: `${desc} — ${brl(amount)} vence hoje.` };
  }
  const dias = Math.abs(diff);
  return {
    title: '⚠️ Conta vencida',
    body: `${desc} — ${brl(amount)} venceu há ${dias} dia${dias > 1 ? 's' : ''}.`,
  };
}

interface DueBill {
  key: string; // id estável p/ throttle e tag
  desc: string;
  amount: number;
  dueStr: string;
  bucket: Bucket;
  diff: number;
}

const db = () => getFirestore();

/** Coleta as contas a pagar (debts + transactions a_pagar) que precisam de aviso. */
async function collectDueBills(uid: string, todayStr: string): Promise<DueBill[]> {
  const bills: DueBill[] = [];

  for (const acc of ACCOUNT_TYPES) {
    const base = db().collection('users').doc(uid).collection('accounts').doc(acc);

    // ── Debts ────────────────────────────────────────────────
    const debtsSnap = await base.collection('debts').get();
    for (const d of debtsSnap.docs) {
      const debt = d.data() as any;
      const installments = debt.installments ?? 1;
      const paid = debt.paidInstallments ?? 0;
      if (debt.status === 'pago' || paid >= installments) continue;
      const dueBase = toBrtDateStr(debt.dueDate);
      if (!dueBase) continue;
      // Próxima parcela não paga = dueDate + paidInstallments meses.
      const nextDue = addMonths(dayDate(dueBase), paid);
      const nextDueStr = nextDue.toISOString().slice(0, 10);
      const c = classify(nextDueStr, todayStr);
      if (!c) continue;
      bills.push({
        key: `debt:${d.id}`,
        desc: debt.description ?? 'Dívida',
        amount: debt.installmentAmount ?? debt.totalAmount ?? 0,
        dueStr: nextDueStr,
        bucket: c.bucket,
        diff: c.diff,
      });
    }

    // ── Transactions a_pagar (despesas) ──────────────────────
    const txSnap = await base
      .collection('transactions')
      .where('status', '==', 'a_pagar')
      .get();
    for (const t of txSnap.docs) {
      const tx = t.data() as any;
      if (tx.type && tx.type !== 'expense') continue;
      const dueStr = toBrtDateStr(tx.date);
      if (!dueStr) continue;
      const c = classify(dueStr, todayStr);
      if (!c) continue;
      bills.push({
        key: `tx:${t.id}`,
        desc: tx.description ?? 'Conta',
        amount: tx.amount ?? 0,
        dueStr,
        bucket: c.bucket,
        diff: c.diff,
      });
    }
  }

  return bills;
}

async function getSubscriptions(uid: string) {
  const snap = await db().collection('users').doc(uid).collection('pushSubscriptions').get();
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((s) => s.endpoint && s.keys);
}

async function sendToUser(uid: string, todayStr: string) {
  const [bills, subs] = await Promise.all([
    collectDueBills(uid, todayStr),
    getSubscriptions(uid),
  ]);
  if (bills.length === 0 || subs.length === 0) return { notified: 0, skipped: bills.length };

  // Throttle diário: users/{uid}/notificationLog/{yyyy-MM-dd} { counts: {key:n} }
  const logRef = db().collection('users').doc(uid).collection('notificationLog').doc(todayStr);
  const logSnap = await logRef.get();
  const counts: Record<string, number> = (logSnap.exists && (logSnap.data() as any).counts) || {};

  let notified = 0;
  let skipped = 0;
  const updates: Record<string, number> = {};

  for (const bill of bills) {
    const already = counts[bill.key] ?? 0;
    if (already >= MAX_PER_DAY) {
      skipped += 1;
      continue;
    }
    const msg = buildMessage(bill.bucket, bill.diff, bill.desc, bill.amount);
    const payload = JSON.stringify({
      title: msg.title,
      body: msg.body,
      url: '/',
      tag: bill.key,
      requireInteraction: true,
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
        } catch (err: any) {
          const status = err?.statusCode;
          if (status === 404 || status === 410) {
            await db()
              .collection('users')
              .doc(uid)
              .collection('pushSubscriptions')
              .doc(sub.id)
              .delete()
              .catch(() => {});
          }
        }
      }),
    );

    counts[bill.key] = already + 1;
    updates[bill.key] = counts[bill.key];
    notified += 1;
  }

  if (notified > 0) {
    await logRef.set(
      { counts: updates, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }

  return { notified, skipped };
}

export default async function handler(req: any, res: any) {
  // Autorização: Vercel Cron manda Authorization: Bearer <CRON_SECRET>.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization;
  const provided = typeof auth === 'string' ? auth.replace(/^Bearer\s+/i, '') : req.query?.secret;
  if (!secret || provided !== secret) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (!process.env.VAPID_PRIVATE_KEY || !process.env.FIREBASE_PRIVATE_KEY) {
    return res.status(500).json({ error: 'missing VAPID/Firebase env' });
  }

  const debug = req.query?.debug === '1';

  try {
    initAdmin();
    // Firestore via REST (evita gRPC, que não empacota bem em serverless).
    try {
      getFirestore().settings({ preferRest: true } as any);
    } catch {
      /* settings só pode ser chamado uma vez; ignora se já setado */
    }
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@seara.finance',
      process.env.VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || '',
    );

    const { dateStr, hour } = nowSaoPaulo();
    const force = req.query?.force === '1' || req.query?.force === 'true';

    if (!force && (hour < BUSINESS_START || hour >= BUSINESS_END)) {
      return res
        .status(200)
        .json({ skipped: true, reason: 'fora do horário comercial', hour, dateStr });
    }

    const usersSnap = await db().collection('users').get();
    let totalNotified = 0;
    let totalSkipped = 0;
    let usersProcessed = 0;

    for (const u of usersSnap.docs) {
      const { notified, skipped } = await sendToUser(u.id, dateStr);
      totalNotified += notified;
      totalSkipped += skipped;
      if (notified > 0) usersProcessed += 1;
    }

    return res.status(200).json({
      ok: true,
      dateStr,
      hour,
      users: usersSnap.size,
      usersNotified: usersProcessed,
      totalNotified,
      totalSkipped,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err?.message || String(err),
      stack: debug ? String(err?.stack || '') : undefined,
    });
  }
}
