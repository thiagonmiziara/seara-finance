import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Composer do chat — input arredondado + botão de enviar com alvo de toque grande. */
export function ChatInput({ onSend, disabled, placeholder, autoFocus }: ChatInputProps) {
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue('');
  };

  return (
    <form
      onSubmit={submit}
      className='flex items-center gap-2 px-3 sm:px-4 py-3 safe-area-bottom'
    >
      <input
        type='text'
        inputMode='text'
        enterKeyHint='send'
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder={placeholder ?? 'Digite sua mensagem...'}
        aria-label='Mensagem para o assistente'
        className={cn(
          'flex-1 min-w-0 h-12 rounded-full border border-border/60 bg-card px-5',
          'text-base leading-relaxed placeholder:text-muted-foreground',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-60',
        )}
      />
      <button
        type='submit'
        disabled={disabled || !value.trim()}
        aria-label='Enviar mensagem'
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
          'bg-primary text-primary-foreground transition-transform',
          'hover:brightness-110 active:scale-90',
          'disabled:opacity-50 disabled:pointer-events-none',
        )}
      >
        <Send className='h-5 w-5' />
      </button>
    </form>
  );
}
