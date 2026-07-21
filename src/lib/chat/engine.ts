import type {
  ChatDataSnapshot,
  ChatEvent,
  ChatFlow,
  ChatOption,
  ChatState,
  FlowContext,
  FlowStep,
} from './types';

export const CANCEL_OPTION_ID = '__cancel__';
export const RETRY_OPTION_ID = '__retry__';
export const CONFIRM_OPTION_ID = '__confirm_yes__';

/** Sentinela de step: "vá para o primeiro step do fluxo alvo". */
const FIRST_STEP = '@first';
const MENU_REF = 'menu::root';

/**
 * Par de botões Sim/Não para um step de confirmação. `CANCEL_OPTION_ID` é
 * interceptado globalmente pelo reducer (volta ao menu), então o step não
 * precisa de `next` customizado: a única opção "viva" que chega até
 * `defaultNextRef` é a de confirmação, que avança para o próximo step do
 * array (tipicamente o 'action' que efetivamente grava).
 */
export function confirmOptions(
  confirmLabel: string,
  cancelLabel = 'Não, cancelar',
  confirmVariant: 'confirm' | 'danger' = 'confirm',
): ChatOption[] {
  return [
    { id: CONFIRM_OPTION_ID, label: confirmLabel, variant: confirmVariant },
    { id: CANCEL_OPTION_ID, label: cancelLabel, variant: 'cancel' },
  ];
}

export function emptyDataSnapshot(): ChatDataSnapshot {
  return {
    recentTransactions: [],
    activeDebts: [],
    activeGoals: [],
    categories: [],
    monthSummary: { income: 0, expense: 0, balance: 0 },
  };
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function pushBotMessage(
  state: ChatState,
  text: string,
  options?: ChatOption[],
): ChatState {
  return {
    ...state,
    messages: [
      ...state.messages,
      { id: newId(), role: 'bot', text, options, timestamp: Date.now() },
    ],
  };
}

function pushUserMessage(state: ChatState, text: string): ChatState {
  return {
    ...state,
    messages: [
      ...state.messages,
      { id: newId(), role: 'user', text, timestamp: Date.now() },
    ],
  };
}

/**
 * Resolve uma referência "flowId::stepId" (ou "stepId" cru, que assume o
 * fluxo atual). `stepId` === '@first' (ou vazio) aponta para o primeiro step
 * do fluxo alvo — usado pelo menu para entrar em qualquer fluxo sem conhecer
 * o id do seu primeiro passo.
 */
function resolveRef(
  ref: string,
  currentFlowId: string,
  flows: Record<string, ChatFlow>,
): { flowId: string; stepId: string } {
  let flowId = currentFlowId;
  let stepId = ref;
  if (ref.includes('::')) {
    [flowId, stepId] = ref.split('::');
  }
  if (stepId === FIRST_STEP || stepId === '') {
    stepId = flows[flowId]?.steps[0]?.id ?? 'root';
  }
  return { flowId, stepId };
}

function findStep(
  flows: Record<string, ChatFlow>,
  flowId: string,
  stepId: string,
): FlowStep | undefined {
  return flows[flowId]?.steps.find((s) => s.id === stepId);
}

function buildContext(state: ChatState, data: ChatDataSnapshot): FlowContext {
  return { answers: state.answers, data };
}

/** Volta ao menu, opcionalmente com um aviso antes. Deixa isTyping=true para
 * encadear uma nova rodada de "digitando" até a saudação do menu aparecer. */
function returnToMenu(state: ChatState, notice?: string): ChatState {
  const withNotice = notice ? pushBotMessage(state, notice) : state;
  return {
    ...withNotice,
    activeFlowId: 'menu',
    stepId: 'root',
    answers: {},
    isTyping: true,
    awaitingAction: false,
    footerOptions: [],
  };
}

/** Avança para o próximo step do array do fluxo atual, ou volta ao menu se
 * este era o último. Usado como destino default quando o step não define `next`. */
function defaultNextRef(flow: ChatFlow, currentStepId: string): string {
  const idx = flow.steps.findIndex((s) => s.id === currentStepId);
  const next = idx >= 0 ? flow.steps[idx + 1] : undefined;
  return next ? next.id : MENU_REF;
}

/** Aplica o destino resolvido ao estado, preparando a próxima rodada de reveal. */
function goTo(
  state: ChatState,
  ref: string,
  flows: Record<string, ChatFlow>,
): ChatState {
  const { flowId, stepId } = resolveRef(ref, state.activeFlowId, flows);
  return {
    ...state,
    activeFlowId: flowId,
    stepId,
    isTyping: true,
    footerOptions: [],
  };
}

/** Cancelar só faz sentido fora do menu raiz. */
function defaultFooterOptions(activeFlowId: string): ChatOption[] {
  if (activeFlowId === 'menu') return [];
  return [{ id: CANCEL_OPTION_ID, label: 'Cancelar', variant: 'cancel' }];
}

/**
 * Renderiza o step apontado por (activeFlowId, stepId): empurra a mensagem do
 * bot e define footerOptions. Steps 'message' e steps 'options' com lista
 * vazia encerram o fluxo e voltam ao menu.
 */
function reveal(
  state: ChatState,
  flows: Record<string, ChatFlow>,
  data: ChatDataSnapshot,
): ChatState {
  const flow = flows[state.activeFlowId];
  const step = findStep(flows, state.activeFlowId, state.stepId);

  if (!flow || !step) {
    return returnToMenu(
      state,
      'Isso ainda não está disponível no assistente. Em breve! 🙂',
    );
  }

  const ctx = buildContext(state, data);

  switch (step.kind) {
    case 'message': {
      const withMsg = pushBotMessage(state, step.text(ctx));
      return returnToMenu(withMsg);
    }

    case 'options': {
      const opts = step.options(ctx);
      if (opts.length === 0) {
        const text = step.emptyText?.(ctx) ?? 'Não encontrei nada por aqui.';
        return returnToMenu(pushBotMessage(state, text));
      }
      const isFooter = step.placement === 'footer';
      const withMsg = pushBotMessage(
        state,
        step.prompt(ctx),
        isFooter ? undefined : opts,
      );
      return {
        ...withMsg,
        isTyping: false,
        footerOptions: isFooter ? opts : defaultFooterOptions(state.activeFlowId),
      };
    }

    case 'input': {
      const withMsg = pushBotMessage(state, step.prompt(ctx));
      return {
        ...withMsg,
        isTyping: false,
        footerOptions: defaultFooterOptions(state.activeFlowId),
      };
    }

    case 'action': {
      // Não empurra mensagem — o hook executa `run()` (efeito próprio) e
      // despacha ACTION_RESULT de volta.
      return { ...state, isTyping: false, awaitingAction: true, footerOptions: [] };
    }

    default:
      return returnToMenu(state);
  }
}

export function createInitialState(
  flows: Record<string, ChatFlow>,
  data: ChatDataSnapshot,
): ChatState {
  const base: ChatState = {
    messages: [],
    activeFlowId: 'menu',
    stepId: 'root',
    answers: {},
    isTyping: false,
    awaitingAction: false,
    footerOptions: [],
  };
  return reveal(base, flows, data);
}

function advanceFromOption(
  state: ChatState,
  step: Extract<FlowStep, { kind: 'options' }>,
  option: ChatOption,
  flow: ChatFlow,
  flows: Record<string, ChatFlow>,
  data: ChatDataSnapshot,
): ChatState {
  const ctx = buildContext(state, data);
  const answered: ChatState = {
    ...state,
    answers: { ...state.answers, [step.id]: option.value ?? option.id },
  };
  const ref = step.next?.(option.id, ctx) ?? defaultNextRef(flow, step.id);
  return goTo(answered, ref, flows);
}

export function chatReducer(
  state: ChatState,
  event: ChatEvent,
  flows: Record<string, ChatFlow>,
  data: ChatDataSnapshot = emptyDataSnapshot(),
): ChatState {
  switch (event.type) {
    case 'SELECT_OPTION': {
      const { option } = event;

      if (option.id === CANCEL_OPTION_ID) {
        return returnToMenu(state, 'Tudo bem, vamos voltar ao início.');
      }
      if (option.id === RETRY_OPTION_ID) {
        return { ...state, isTyping: false, awaitingAction: true, footerOptions: [] };
      }

      const flow = flows[state.activeFlowId];
      const step = findStep(flows, state.activeFlowId, state.stepId);
      if (!flow || !step || step.kind !== 'options') return state;

      const withEcho = pushUserMessage(state, option.label);
      return advanceFromOption(withEcho, step, option, flow, flows, data);
    }

    case 'SEND_TEXT': {
      const trimmed = event.text.trim();
      if (!trimmed) return state;

      const flow = flows[state.activeFlowId];
      const step = findStep(flows, state.activeFlowId, state.stepId);
      if (!flow || !step) return state;

      if (step.kind === 'input') {
        const ctx = buildContext(state, data);
        const result = step.parse(trimmed, ctx);
        const withEcho = pushUserMessage(state, trimmed);
        if (!result.ok) {
          return pushBotMessage(withEcho, `${result.error}\n\n${step.prompt(ctx)}`);
        }
        const answered: ChatState = {
          ...withEcho,
          answers: { ...withEcho.answers, [step.id]: result.value },
        };
        return goTo(answered, defaultNextRef(flow, step.id), flows);
      }

      if (step.kind === 'options') {
        const ctx = buildContext(state, data);
        const opts = step.options(ctx);
        const asIndex = Number.parseInt(trimmed, 10);
        const matched =
          (Number.isFinite(asIndex) && opts[asIndex - 1]) ||
          opts.find((o) => o.label.toLowerCase().includes(trimmed.toLowerCase()));

        const withEcho = pushUserMessage(state, trimmed);
        if (!matched) {
          return pushBotMessage(
            withEcho,
            'Não entendi. Toque numa das opções acima ou digite o número dela.',
            step.placement === 'footer' ? undefined : opts,
          );
        }
        return advanceFromOption(withEcho, step, matched, flow, flows, data);
      }

      return state;
    }

    case 'REVEAL':
      return reveal(state, flows, data);

    case 'ACTION_RESULT': {
      const withMsg = pushBotMessage(state, event.text);
      if (event.failed) {
        return {
          ...withMsg,
          isTyping: false,
          awaitingAction: false,
          footerOptions: [
            { id: RETRY_OPTION_ID, label: 'Tentar de novo' },
            { id: CANCEL_OPTION_ID, label: 'Voltar ao menu', variant: 'cancel' },
          ],
        };
      }
      return returnToMenu({ ...withMsg, awaitingAction: false });
    }

    case 'PREFILL_FLOW': {
      if (!flows[event.flowId]) {
        return returnToMenu(
          state,
          'Isso ainda não está disponível no assistente. Em breve! 🙂',
        );
      }
      const withEcho = pushUserMessage(state, event.echo);
      return goTo(
        { ...withEcho, answers: event.answers },
        `${event.flowId}::${event.stepId}`,
        flows,
      );
    }

    case 'CANCEL':
      return returnToMenu(state, 'Tudo bem, vamos voltar ao início.');

    case 'RESET':
      return createInitialState(flows, data);

    default:
      return state;
  }
}
