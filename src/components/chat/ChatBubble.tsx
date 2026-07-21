import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage, ChatOption } from '@/lib/chat/types';

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ChatBubbleProps {
  message: ChatMessage;
  /** Opções tocáveis dentro do balão (ex.: lista de dívidas/metas/categorias). */
  onOptionSelect?: (option: ChatOption) => void;
  disabled?: boolean;
}

const OPTION_VARIANT_CLASS: Record<NonNullable<ChatOption['variant']>, string> = {
  default:
    'border-border/60 bg-background hover:bg-muted/60 text-foreground',
  confirm:
    'border-primary/50 bg-primary/10 hover:bg-primary/15 text-primary font-semibold',
  danger:
    'border-red-500/40 bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 font-semibold',
  cancel:
    'border-border/60 bg-background hover:bg-muted/60 text-muted-foreground',
};

/**
 * Balão de mensagem estilo WhatsApp — usando os tokens de tema do Seara
 * (não as cores literais do WhatsApp) para manter contraste e identidade
 * visual em ambos os temas. O "feel" WhatsApp vem da forma: cantos
 * assimétricos, timestamp + duplo-check, bolha de digitando.
 */
export function ChatBubble({ message, onOptionSelect, disabled }: ChatBubbleProps) {
  const isBot = message.role === 'bot';

  return (
    <div
      className={cn(
        'flex w-full',
        isBot ? 'justify-start anim-msg-in-left' : 'justify-end anim-msg-in-right',
      )}
    >
      <div className='flex flex-col gap-2 max-w-[85%] sm:max-w-[75%]'>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 shadow-soft',
            isBot
              ? 'bg-card border border-border/60 text-foreground rounded-tl-sm'
              : 'bg-primary text-primary-foreground rounded-tr-sm',
          )}
        >
          <p className='sr-only'>{isBot ? 'Assistente: ' : 'Você: '}</p>
          <p className='text-base leading-relaxed whitespace-pre-wrap break-words'>
            {message.text}
          </p>
          <p
            className={cn(
              'text-[11px] mt-1 flex items-center justify-end gap-1',
              isBot ? 'text-muted-foreground' : 'text-primary-foreground/80',
            )}
          >
            {formatTime(message.timestamp)}
            {!isBot && <CheckCheck className='h-3.5 w-3.5' aria-hidden='true' />}
          </p>
        </div>

        {message.options && message.options.length > 0 && (
          <div
            role='group'
            aria-label='Opções de resposta'
            className='flex flex-col gap-2'
          >
            {message.options.map((opt) => (
              <button
                key={opt.id}
                type='button'
                disabled={disabled}
                onClick={() => onOptionSelect?.(opt)}
                className={cn(
                  'flex items-center justify-between gap-3 min-h-12 rounded-xl border px-4 py-2.5 text-left transition-colors',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  OPTION_VARIANT_CLASS[opt.variant ?? 'default'],
                )}
              >
                <span className='flex flex-col min-w-0'>
                  <span className='text-base font-medium truncate'>{opt.label}</span>
                  {opt.sublabel && (
                    <span className='text-sm opacity-80 truncate'>{opt.sublabel}</span>
                  )}
                </span>
                {opt.variant === 'confirm' && (
                  <Check className='h-5 w-5 shrink-0' aria-hidden='true' />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
