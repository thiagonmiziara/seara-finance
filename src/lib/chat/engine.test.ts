import { describe, expect, it } from 'vitest';
import {
  CANCEL_OPTION_ID,
  chatReducer,
  confirmOptions,
  createInitialState,
  emptyDataSnapshot,
} from './engine';
import type { ChatFlow, ChatState } from './types';

const TEST_MENU: ChatFlow = {
  id: 'menu',
  steps: [
    {
      id: 'root',
      kind: 'options',
      prompt: () => 'Menu?',
      options: () => [{ id: 'test-flow', label: 'Testar fluxo' }],
      next: (optionId) => `${optionId}::@first`,
    },
  ],
};

const TEST_FLOW: ChatFlow = {
  id: 'test-flow',
  steps: [
    {
      id: 'start',
      kind: 'input',
      prompt: () => 'Quanto?',
      parse: (raw) => {
        const n = Number(raw.replace(',', '.'));
        return Number.isFinite(n) && n > 0
          ? { ok: true, value: n }
          : { ok: false, error: 'Valor inválido' };
      },
    },
    {
      id: 'confirm',
      kind: 'options',
      placement: 'footer',
      prompt: (ctx) => `Confirma R$ ${ctx.answers.start}?`,
      options: () => confirmOptions('Sim, confirmar'),
    },
    {
      id: 'save',
      kind: 'action',
      run: async (ctx) => `Salvo: R$ ${ctx.answers.start}`,
    },
  ],
};

const FLOWS: Record<string, ChatFlow> = {
  menu: TEST_MENU,
  'test-flow': TEST_FLOW,
};

function initial(): ChatState {
  return createInitialState(FLOWS, emptyDataSnapshot());
}

function reduce(state: ChatState, event: Parameters<typeof chatReducer>[1]) {
  return chatReducer(state, event, FLOWS, emptyDataSnapshot());
}

describe('chatReducer', () => {
  it('mostra a saudação do menu com opções ao iniciar', () => {
    const state = initial();
    const last = state.messages.at(-1);
    expect(last?.role).toBe('bot');
    expect(last?.options).toHaveLength(1);
    expect(state.activeFlowId).toBe('menu');
    expect(state.isTyping).toBe(false);
  });

  it('fluxo feliz: menu -> input -> confirmar -> action -> volta ao menu', () => {
    let state = initial();

    state = reduce(state, {
      type: 'SELECT_OPTION',
      option: { id: 'test-flow', label: 'Testar fluxo' },
    });
    expect(state.activeFlowId).toBe('test-flow');
    expect(state.stepId).toBe('start');
    expect(state.isTyping).toBe(true);

    state = reduce(state, { type: 'REVEAL' });
    expect(state.messages.at(-1)?.text).toBe('Quanto?');
    expect(state.footerOptions).toEqual([
      { id: CANCEL_OPTION_ID, label: 'Cancelar', variant: 'cancel' },
    ]);

    state = reduce(state, { type: 'SEND_TEXT', text: '50' });
    expect(state.answers.start).toBe(50);
    expect(state.stepId).toBe('confirm');
    expect(state.isTyping).toBe(true);

    state = reduce(state, { type: 'REVEAL' });
    expect(state.messages.at(-1)?.text).toBe('Confirma R$ 50?');
    expect(state.footerOptions.map((o) => o.id)).toEqual([
      '__confirm_yes__',
      CANCEL_OPTION_ID,
    ]);

    state = reduce(state, {
      type: 'SELECT_OPTION',
      option: { id: '__confirm_yes__', label: 'Sim, confirmar', variant: 'confirm' },
    });
    expect(state.stepId).toBe('save');
    expect(state.isTyping).toBe(true);

    state = reduce(state, { type: 'REVEAL' });
    expect(state.awaitingAction).toBe(true);
    expect(state.isTyping).toBe(false);

    state = reduce(state, { type: 'ACTION_RESULT', text: 'Salvo: R$ 50' });
    expect(state.messages.at(-1)?.text).toBe('Salvo: R$ 50');
    expect(state.awaitingAction).toBe(false);
    expect(state.activeFlowId).toBe('menu');
    expect(state.isTyping).toBe(true);

    state = reduce(state, { type: 'REVEAL' });
    expect(state.activeFlowId).toBe('menu');
    expect(state.messages.at(-1)?.options).toHaveLength(1);
  });

  it('valor inválido não avança e repete a pergunta', () => {
    let state = initial();
    state = reduce(state, {
      type: 'SELECT_OPTION',
      option: { id: 'test-flow', label: 'Testar fluxo' },
    });
    state = reduce(state, { type: 'REVEAL' });

    state = reduce(state, { type: 'SEND_TEXT', text: 'abc' });
    expect(state.stepId).toBe('start');
    expect(state.isTyping).toBe(false);
    expect(state.messages.at(-1)?.text).toContain('Valor inválido');
  });

  it('cancelar no meio do fluxo volta ao menu sem gravar nada', () => {
    let state = initial();
    state = reduce(state, {
      type: 'SELECT_OPTION',
      option: { id: 'test-flow', label: 'Testar fluxo' },
    });
    state = reduce(state, { type: 'REVEAL' });
    state = reduce(state, { type: 'SEND_TEXT', text: '50' });
    state = reduce(state, { type: 'REVEAL' });

    state = reduce(state, {
      type: 'SELECT_OPTION',
      option: { id: CANCEL_OPTION_ID, label: 'Não, cancelar', variant: 'cancel' },
    });
    expect(state.activeFlowId).toBe('menu');
    expect(state.stepId).toBe('root');
    expect(state.isTyping).toBe(true);
  });

  it('digitar o número da opção seleciona-a (fallback numerado)', () => {
    let state = initial();
    state = reduce(state, { type: 'SEND_TEXT', text: '1' });
    expect(state.activeFlowId).toBe('test-flow');
    expect(state.stepId).toBe('start');
  });

  it('fluxo/step inexistente cai com aviso e volta ao menu', () => {
    const broken: ChatState = { ...initial(), activeFlowId: 'nao-existe', stepId: 'x' };
    const state = reduce(broken, { type: 'REVEAL' });
    expect(state.messages.at(-1)?.text).toContain('ainda não está disponível');
    expect(state.activeFlowId).toBe('menu');
  });

  it('menu entra no primeiro step do fluxo alvo via @first', () => {
    let state = initial();
    state = reduce(state, {
      type: 'SELECT_OPTION',
      option: { id: 'test-flow', label: 'Testar fluxo' },
    });
    // primeiro step do TEST_FLOW é 'start'
    expect(state.activeFlowId).toBe('test-flow');
    expect(state.stepId).toBe('start');
  });
});
