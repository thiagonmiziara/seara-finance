// Humanizer: gera respostas variadas e conversacionais para o bot,
// sem chamar Gemini de novo (economia de quota). Usa templates com
// picks aleatórios e o primeiro nome do usuário quando disponível.

import type {
  ParsedTransaction,
  ParsedDebt,
  ParsedRecurringBill,
} from './ai-types.js';
import type { Summary } from './supabase.js';

const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });

function firstName(name: string | null | undefined): string {
  if (!name) return '';
  return name.trim().split(/\s+/)[0];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function withName(name: string, options: string[]): string {
  return pick(options).replace('{nome}', name ? `, ${name}` : '');
}

// ─── transaction confirmations ──────────────────────────────────────────────

const EXPENSE_OPENERS = [
  'Anotado{nome}!',
  'Beleza{nome}, ficou registrado.',
  'Pode deixar{nome}, salvei aqui.',
  'Tá feito{nome}.',
  'Salvo{nome}!',
  'Conta lançada{nome}.',
];

const INCOME_OPENERS = [
  'Boa{nome}! Entrada registrada.',
  '{nome}, dinheiro novo no caixa 💪',
  'Salvei essa entrada{nome}!',
  '{nome}, anotado como receita.',
  'Beleza{nome}, contabilizando.',
];

const EXPENSE_TIPS = [
  '_Vou te avisar quando o mês esquentar._',
  '_Se quiser ver o resumo, manda "saldo"._',
  '_Quer ver o total do mês? "resumo do mês"._',
  '',
];

const INCOME_TIPS = [
  '_Bem-vindo o reforço no caixa._',
  '_Quer ver o saldo atualizado? "saldo"._',
  '_Continua assim que o mês fica leve._',
  '',
];

export function humanizeTransaction(
  userName: string | null | undefined,
  tx: ParsedTransaction,
): string {
  const nm = firstName(userName);
  const isIncome = tx.type === 'income';
  const opener = withName(nm, isIncome ? INCOME_OPENERS : EXPENSE_OPENERS);
  const tip = pick(isIncome ? INCOME_TIPS : EXPENSE_TIPS);
  const emoji = isIncome ? '💰' : '💸';

  return [
    opener,
    '',
    `${emoji} *${tx.description}* — ${fmtBRL(tx.amount)}`,
    `🏷️  ${tx.category}  •  📅 ${tx.date}`,
    tip ? `\n${tip}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

// ─── debt ───────────────────────────────────────────────────────────────────

const DEBT_OPENERS = [
  'Anotei a dívida{nome}.',
  'Beleza{nome}, parcelamento registrado.',
  '{nome}, ficou no mapa.',
  'Salvei{nome}.',
];

export function humanizeDebt(
  userName: string | null | undefined,
  d: ParsedDebt,
): string {
  const nm = firstName(userName);
  const opener = withName(nm, DEBT_OPENERS);
  return [
    opener,
    '',
    `🧾 *${d.description}*`,
    `💵 Total: ${fmtBRL(d.totalAmount)}`,
    `📅 ${d.installments}x de ${fmtBRL(d.installmentAmount)}`,
    `🗓️  Próxima: ${d.dueDate}`,
    '',
    pick([
      '_Vou avisar quando a próxima parcela aproximar._',
      '_Acompanha pelo app pra ver as parcelas pagas._',
      '',
    ]),
  ]
    .filter((l) => l !== '')
    .join('\n');
}

// ─── recurring bill ─────────────────────────────────────────────────────────

const BILL_OPENERS = [
  'Conta fixa cadastrada{nome}!',
  '{nome}, anotei como mensal.',
  'Beleza{nome}, vai entrar todo mês.',
  'Tá no calendário{nome}.',
];

export function humanizeRecurringBill(
  userName: string | null | undefined,
  r: ParsedRecurringBill,
): string {
  const nm = firstName(userName);
  const opener = withName(nm, BILL_OPENERS);
  const verb = r.type === 'income' ? 'Receita' : 'Conta';
  const emoji = r.type === 'income' ? '💰' : '📅';
  return [
    opener,
    '',
    `${emoji} *${verb} fixa: ${r.description}*`,
    `💵 ${fmtBRL(r.amount)}`,
    `🏷️  ${r.category}`,
    `🗓️  Todo dia ${r.dueDay}`,
    '',
    '_O sistema gera a transação automaticamente todo mês._',
  ].join('\n');
}

// ─── report ─────────────────────────────────────────────────────────────────

const REPORT_OPENERS_POSITIVE = [
  '{nome}, segura essa boa notícia 👇',
  'Tá tudo no azul{nome}!',
  'Segue o jogo{nome}, saldo positivo:',
  'Boa pegada{nome}, olha o resultado:',
];

const REPORT_OPENERS_NEGATIVE = [
  '{nome}, vamo prestar atenção esse mês:',
  '{nome}, o saldo tá apertado. Olha o quadro:',
  'Sem pânico{nome}, mas tá no vermelho:',
  '{nome}, hora de respirar fundo e olhar:',
];

const REPORT_OPENERS_NEUTRAL = [
  'Aqui{nome}, teu resumo:',
  'Direto ao ponto{nome}:',
  '{nome}, segue o panorama:',
];

const PERIOD_LABEL: Record<string, string> = {
  hoje: 'Hoje',
  'últimos 7 dias': 'Última semana',
  'este mês': 'Este mês',
  'este ano': 'Este ano',
};

export function humanizeReport(
  userName: string | null | undefined,
  periodLabel: string,
  s: Summary,
): string {
  const nm = firstName(userName);
  const empty = s.count === 0;

  if (empty) {
    return [
      withName(nm, [
        '{nome}, ainda não tem nada registrado nesse período.',
        '{nome}, esse período tá zerado.',
        'Nada por aqui{nome}, manda algo tipo "gastei 30 no almoço".',
      ]),
    ].join('\n');
  }

  const title = PERIOD_LABEL[periodLabel] ?? periodLabel;
  const opener =
    s.balance > 0
      ? withName(nm, REPORT_OPENERS_POSITIVE)
      : s.balance < 0
        ? withName(nm, REPORT_OPENERS_NEGATIVE)
        : withName(nm, REPORT_OPENERS_NEUTRAL);

  const arrow = s.balance >= 0 ? '🟢' : '🔴';
  const top = s.topExpenseCategories
    .slice(0, 3)
    .map(
      (c, i) =>
        `   ${['🥇', '🥈', '🥉'][i] ?? '•'} ${c.category} — ${fmtBRL(c.amount)}`,
    )
    .join('\n');

  const lines = [
    opener,
    '',
    `📊 *${title}*`,
    `${arrow} *${fmtBRL(s.balance)}* de saldo`,
    `   ↗️ ${fmtBRL(s.income)} entraram  •  ↘️ ${fmtBRL(s.expense)} saíram`,
    `   🧾 ${s.count} transaç${s.count === 1 ? 'ão' : 'ões'}`,
  ];

  if (s.topExpenseCategories.length > 0) {
    lines.push('', '*Onde o dinheiro foi:*', top);
  }

  // closer
  if (s.balance > s.income * 0.3) {
    lines.push('', pick(['_Tá num bom ritmo._', '_Sobrou bem._', '']));
  } else if (s.balance < 0) {
    lines.push(
      '',
      pick([
        '_Bora segurar uma categoria essa semana._',
        '_Talvez vale revisar a maior categoria._',
        '',
      ]),
    );
  }

  return lines.filter((l) => l !== '').join('\n');
}

// ─── didn't understand ──────────────────────────────────────────────────────

const NOT_UNDERSTOOD = [
  'Hmm{nome}, não peguei a ideia.',
  '{nome}, dá pra reformular?',
  'Não captei{nome}.',
  'Foi mal{nome}, não entendi 100%.',
];

const HINTS = [
  'Tenta tipo "gastei 30 no almoço" ou "saldo do mês".',
  'Manda algo como "recebi 200 freela" ou "resumo da semana".',
  'Exemplos: "paguei 80 no Uber", "quanto gastei hoje?".',
];

export function humanizeUnknown(
  userName: string | null | undefined,
): string {
  const nm = firstName(userName);
  return [withName(nm, NOT_UNDERSTOOD), '', `💡 ${pick(HINTS)}`].join('\n');
}

// ─── greetings / first time ─────────────────────────────────────────────────

export function humanizeUnregistered(phone: string): string {
  return [
    '👋 Oi! Eu sou o Finzap, seu assistente financeiro.',
    '',
    'Não te encontrei aqui ainda. Pra começar:',
    '1. Abre o Finzap no navegador',
    '2. Faz login com seu e-mail',
    '3. Clica em "Conectar WhatsApp" lá em cima',
    `4. Cadastra o número *${phone}*`,
    '',
    '_Aí a gente conversa._',
  ].join('\n');
}

// ─── audio echo ─────────────────────────────────────────────────────────────

const AUDIO_OPENERS = [
  '🎤 Ouvi:',
  '🎤 Entendi assim:',
  '🎤 Você disse:',
  '🎤 Captei:',
];

export function humanizeAudioTranscript(transcript: string): string {
  return `${pick(AUDIO_OPENERS)} _"${transcript.slice(0, 200)}"_`;
}

// ─── help ───────────────────────────────────────────────────────────────────

export function humanizeHelp(userName: string | null | undefined): string {
  const nm = firstName(userName);
  return [
    `${nm ? `${nm}, ` : ''}aqui tá o que eu sei fazer:`,
    '',
    '✏️  *Gasto/Receita única*',
    '   • "gastei 50 no mercado"',
    '   • "recebi 3000 freela"',
    '',
    '🧾  *Dívida parcelada*',
    '   • "comprei celular 3000 em 12x"',
    '   • "parcelei tênis em 6x de 80"',
    '',
    '📅  *Conta fixa mensal*',
    '   • "aluguel 1500 todo dia 10"',
    '   • "netflix 55 mensal"',
    '',
    '🎤  *Áudio* — fala normal, eu transcrevo',
    '📸  *Foto* — comprovante / PIX vira transação',
    '',
    '📊  *Relatório*',
    '   • "saldo" ou "resumo do mês"',
    '   • "hoje", "essa semana", "esse ano"',
    '',
    '_Categoria nova você inventa — eu cadastro._',
    '_Pra parar de receber, responde SAIR._',
  ].join('\n');
}

// ─── error ──────────────────────────────────────────────────────────────────

export function humanizeError(message: string): string {
  return [
    pick([
      'Ih, deu erro aqui:',
      'Algo travou:',
      'Eita, não consegui:',
    ]),
    `_${message.slice(0, 160)}_`,
    '',
    'Tenta de novo daqui a pouco?',
  ].join('\n');
}
