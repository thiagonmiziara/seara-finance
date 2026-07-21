import { useEffect, useRef } from 'react';
import { ChatBubble } from './ChatBubble';
import { TypingBubble } from './TypingBubble';
import type { ChatMessage, ChatOption } from '@/lib/chat/types';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isTyping?: boolean;
  onOptionSelect?: (option: ChatOption) => void;
  /** Desabilita opções de mensagens antigas enquanto uma ação está em curso. */
  optionsDisabled?: boolean;
}

/** Distância do fim (px) abaixo da qual consideramos o usuário "grudado no fim". */
const PIN_THRESHOLD = 140;

export function ChatMessageList({
  messages,
  isTyping,
  onOptionSelect,
  optionsDisabled,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Começa "grudado no fim"; só desgruda se o usuário rolar para cima.
  const pinnedRef = useRef(true);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedRef.current = distance <= PIN_THRESHOLD;
  };

  // Rola para a última mensagem sempre que chega conteúdo novo — a menos que
  // o usuário tenha rolado para cima para ler o histórico.
  useEffect(() => {
    if (!pinnedRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role='log'
      aria-live='polite'
      aria-label='Conversa com o assistente'
      className='flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 space-y-3'
    >
      {messages.map((m) => (
        <ChatBubble
          key={m.id}
          message={m}
          onOptionSelect={onOptionSelect}
          disabled={optionsDisabled}
        />
      ))}
      {isTyping && (
        <>
          <span className='sr-only'>Assistente está digitando</span>
          <TypingBubble />
        </>
      )}
    </div>
  );
}
