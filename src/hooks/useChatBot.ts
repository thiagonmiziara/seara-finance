import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { startOfMonth, endOfDay } from 'date-fns';
import { useFinance } from './useFinance';
import { useDebts } from './useDebts';
import { useGoals } from './useGoals';
import { useCategories } from './useCategories';
import { chatReducer, createInitialState } from '@/lib/chat/engine';
import { FLOWS } from '@/lib/chat/flows';
import { getSavedChatState, setSavedChatState } from '@/lib/chat/store';
import { parseNaturalTransaction } from '@/lib/chat/parse';
import type {
  ChatActions,
  ChatDataSnapshot,
  ChatEvent,
  ChatOption,
  ChatState,
} from '@/lib/chat/types';

const TYPING_DELAY_MS = 550;
const TYPING_DELAY_REDUCED_MS = 120;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Orquestra o motor de conversa. Ponto-chave: os dados vivos NÃO entram no
 * estado do reducer (evita loop de re-render — os hooks devolvem objetos de
 * identidade nova a cada render). Em vez disso ficam num ref sempre atual e
 * são injetados no reducer a cada dispatch.
 */
export function useChatBot() {
  const monthRange = useMemo(
    () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }),
    [],
  );

  const finance = useFinance(monthRange);
  const debts = useDebts();
  const goals = useGoals();
  const categoriesHook = useCategories();

  const data: ChatDataSnapshot = useMemo(
    () => ({
      recentTransactions: [...finance.dashboardTransactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10),
      activeDebts: debts.debts.filter((d) => d.status === 'a_pagar'),
      activeGoals: goals.goals.filter((g) => g.status === 'active'),
      categories: categoriesHook.categories,
      monthSummary: finance.summary,
    }),
    [
      finance.dashboardTransactions,
      finance.summary,
      debts.debts,
      goals.goals,
      categoriesHook.categories,
    ],
  );

  // Refs sempre com os valores mais recentes, lidos no dispatch/efeito —
  // nunca viram dependência (o que reintroduziria o loop).
  const dataRef = useRef<ChatDataSnapshot>(data);
  dataRef.current = data;

  const actionsRef = useRef<ChatActions>({
    addTransaction: finance.addTransaction,
    removeTransaction: finance.removeTransaction,
    updateTransactionStatus: finance.updateTransactionStatus,
    incrementInstallment: debts.incrementInstallment,
    settleDebt: debts.settleDebt,
    addContribution: goals.addContribution,
  });
  actionsRef.current = {
    addTransaction: finance.addTransaction,
    removeTransaction: finance.removeTransaction,
    updateTransactionStatus: finance.updateTransactionStatus,
    incrementInstallment: debts.incrementInstallment,
    settleDebt: debts.settleDebt,
    addContribution: goals.addContribution,
  };

  const boundReducer = useCallback(
    (chatState: ChatState, event: ChatEvent) =>
      chatReducer(chatState, event, FLOWS, dataRef.current),
    [],
  );

  const [state, dispatch] = useReducer(
    boundReducer,
    undefined,
    () => getSavedChatState() ?? createInitialState(FLOWS, dataRef.current),
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  // Persiste entre trocas de rota (o AppShell desmonta a página do chat).
  useEffect(() => {
    setSavedChatState(state);
  }, [state]);

  // Pausa de "digitando…" antes de revelar o próximo conteúdo estático.
  useEffect(() => {
    if (!state.isTyping) return;
    const delay = prefersReducedMotion() ? TYPING_DELAY_REDUCED_MS : TYPING_DELAY_MS;
    const timer = window.setTimeout(() => dispatch({ type: 'REVEAL' }), delay);
    return () => window.clearTimeout(timer);
  }, [state.isTyping, state.activeFlowId, state.stepId]);

  // Executa o efeito assíncrono de um step 'action' (fora do reducer puro).
  useEffect(() => {
    if (!state.awaitingAction) return;
    const flow = FLOWS[state.activeFlowId];
    const step = flow?.steps.find((s) => s.id === state.stepId);
    if (!step || step.kind !== 'action') return;

    let cancelled = false;
    void step
      .run({ answers: state.answers, data: dataRef.current }, actionsRef.current)
      .then((text) => {
        if (!cancelled) dispatch({ type: 'ACTION_RESULT', text });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Algo deu errado, nada foi salvo.';
        dispatch({ type: 'ACTION_RESULT', text: message, failed: true });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.awaitingAction, state.activeFlowId, state.stepId]);

  const selectOption = useCallback((option: ChatOption) => {
    dispatch({ type: 'SELECT_OPTION', option });
  }, []);

  const sendText = useCallback((text: string) => {
    // Atalho de texto livre só no menu raiz — dentro de um fluxo, o texto
    // sempre responde ao step atual (ver chatReducer 'SEND_TEXT').
    if (stateRef.current.activeFlowId === 'menu') {
      const natural = parseNaturalTransaction(text, dataRef.current.categories);
      if (natural) {
        dispatch({
          type: 'PREFILL_FLOW',
          echo: text,
          flowId: 'add-transaction',
          stepId: 'confirm',
          answers: {
            type: natural.type,
            description: natural.description,
            amount: natural.amount,
            category: natural.category.value,
          },
        });
        return;
      }
    }
    dispatch({ type: 'SEND_TEXT', text });
  }, []);

  // "Ocupado" cobre a pausa de "digitando…" e a execução de uma ação — em
  // ambos os casos a UI trava pra evitar toque duplicado.
  const isBusy = state.isTyping || state.awaitingAction;

  return {
    messages: state.messages,
    footerOptions: state.footerOptions,
    isTyping: isBusy,
    selectOption,
    sendText,
  };
}
