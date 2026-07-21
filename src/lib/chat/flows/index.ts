import type { ChatFlow } from '../types';
import { MENU_FLOW } from './menu';
import { SUMMARY_FLOW } from './summary';
import { ADD_TRANSACTION_FLOW } from './addTransaction';
import { MANAGE_TRANSACTION_FLOW } from './manageTransaction';
import { PAY_DEBT_FLOW } from './debts';
import { GOAL_CONTRIBUTION_FLOW } from './goals';

/**
 * Registro de fluxos disponíveis. Fluxos referenciados pelo menu mas ainda
 * não registrados aqui são tratados de forma graciosa pelo engine —
 * mensagem "ainda não disponível" (ver reveal() em engine.ts).
 */
export const FLOWS: Record<string, ChatFlow> = {
  [MENU_FLOW.id]: MENU_FLOW,
  [SUMMARY_FLOW.id]: SUMMARY_FLOW,
  [ADD_TRANSACTION_FLOW.id]: ADD_TRANSACTION_FLOW,
  [MANAGE_TRANSACTION_FLOW.id]: MANAGE_TRANSACTION_FLOW,
  [PAY_DEBT_FLOW.id]: PAY_DEBT_FLOW,
  [GOAL_CONTRIBUTION_FLOW.id]: GOAL_CONTRIBUTION_FLOW,
};
