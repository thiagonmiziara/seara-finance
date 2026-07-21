import type { ChatState } from './types';

/**
 * Estado da conversa preservado em memória de módulo — sobrevive à troca de
 * rota (o AppShell desmonta a página do Assistente), sem precisar serializar
 * (algumas opções carregam objetos Debt/Goal inteiros). Um refresh de página
 * reinicia a conversa: aceitável, já que ela é efêmera (os dados reais vivem
 * no Firestore).
 */
let savedState: ChatState | null = null;

export function getSavedChatState(): ChatState | null {
  return savedState;
}

export function setSavedChatState(state: ChatState): void {
  savedState = state;
}

export function clearSavedChatState(): void {
  savedState = null;
}
