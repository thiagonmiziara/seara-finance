import type { Debt, GoalWithProgress, Transaction, TransactionFormValues } from '@/types';

export type ChatRole = 'bot' | 'user';

export interface ChatOption {
  id: string;
  label: string;
  /** Linha secundária menor, ex.: "R$ 45,90 · 12/07 · a pagar". */
  sublabel?: string;
  /** Payload livre carregado pela opção (ex.: um objeto Debt/Goal inteiro). */
  value?: unknown;
  variant?: 'default' | 'confirm' | 'danger' | 'cancel';
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Opções tocáveis exibidas dentro do balão (ex.: lista de dívidas/metas). */
  options?: ChatOption[];
  timestamp: number;
}

/** Snapshot de dados vivos injetado no motor pelos hooks do app. */
export interface ChatDataSnapshot {
  recentTransactions: Transaction[];
  activeDebts: Debt[];
  activeGoals: GoalWithProgress[];
  categories: { value: string; label: string; color: string }[];
  monthSummary: { income: number; expense: number; balance: number };
}

/** Ações que os fluxos podem disparar — mapeiam para os `mutateAsync` dos hooks. */
export interface ChatActions {
  addTransaction: (data: TransactionFormValues) => Promise<unknown>;
  removeTransaction: (id: string) => Promise<unknown>;
  updateTransactionStatus: (v: {
    id: string;
    status: Transaction['status'];
  }) => Promise<unknown>;
  incrementInstallment: (debt: Debt) => Promise<unknown>;
  settleDebt: (debt: Debt) => Promise<unknown>;
  addContribution: (v: {
    goalId: string;
    amount: number;
    contributedAt: string;
    note?: string | null;
  }) => Promise<unknown>;
}

export interface FlowContext {
  /** Respostas acumuladas nesta execução do fluxo, chaveadas pelo `id` do step. */
  answers: Record<string, unknown>;
  data: ChatDataSnapshot;
}

export type ParseResult<T = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Um passo do fluxo. `id` é usado para (a) chavear a resposta em
 * FlowContext.answers e (b) ser alvo de saltos via `next` (formato
 * "flowId::stepId"; sem flowId assume o fluxo atual).
 */
export type FlowStep =
  | { id: string; kind: 'message'; text: (ctx: FlowContext) => string }
  | {
      id: string;
      kind: 'options';
      prompt: (ctx: FlowContext) => string;
      options: (ctx: FlowContext) => ChatOption[];
      /** Mensagem amigável quando `options(ctx)` vier vazia (ex.: sem dívidas ativas). */
      emptyText?: (ctx: FlowContext) => string;
      /** 'footer' fixa as opções acima do composer (ex.: confirmações curtas). */
      placement?: 'bubble' | 'footer';
      /** Destino por opção selecionada. Default: próximo step do array. */
      next?: (optionId: string, ctx: FlowContext) => string | undefined;
    }
  | {
      id: string;
      kind: 'input';
      prompt: (ctx: FlowContext) => string;
      parse: (raw: string, ctx: FlowContext) => ParseResult;
    }
  | {
      id: string;
      kind: 'action';
      run: (ctx: FlowContext, actions: ChatActions) => Promise<string>;
    };

export interface ChatFlow {
  id: string;
  steps: FlowStep[];
}

export interface ChatState {
  messages: ChatMessage[];
  activeFlowId: string;
  stepId: string;
  answers: Record<string, unknown>;
  isTyping: boolean;
  /** true enquanto o hook está executando o `run()` assíncrono de um step 'action'. */
  awaitingAction: boolean;
  /** Opções fixadas no rodapé (confirmações curtas, cancelar). */
  footerOptions: ChatOption[];
}

/**
 * Os dados vivos (ChatDataSnapshot) NÃO ficam no estado — são injetados no
 * reducer a cada dispatch pelo useChatBot (via ref), evitando um loop de
 * re-render (os hooks retornam objetos com identidade nova a cada render).
 */
export type ChatEvent =
  | { type: 'SELECT_OPTION'; option: ChatOption }
  | { type: 'SEND_TEXT'; text: string }
  | { type: 'REVEAL' }
  | { type: 'ACTION_RESULT'; text: string; failed?: boolean }
  | { type: 'CANCEL' }
  | { type: 'RESET' }
  | {
      /** Atalho de texto livre: entra direto num fluxo com respostas já
       * preenchidas (ex.: "paguei 50 mercado" pulando pro passo de confirmar). */
      type: 'PREFILL_FLOW';
      echo: string;
      flowId: string;
      stepId: string;
      answers: Record<string, unknown>;
    };
