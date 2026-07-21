import { cn } from '@/lib/utils';
import type { ChatOption } from '@/lib/chat/types';

const VARIANT_CLASS: Record<NonNullable<ChatOption['variant']>, string> = {
  default: 'border-primary/40 bg-primary/10 hover:bg-primary/15 text-primary',
  confirm:
    'border-primary bg-primary hover:bg-primary/90 text-primary-foreground',
  danger:
    'border-red-500 bg-red-500 hover:bg-red-500/90 text-white',
  cancel: 'border-border/60 bg-card hover:bg-muted/60 text-muted-foreground',
};

interface QuickRepliesProps {
  options: ChatOption[];
  onSelect: (option: ChatOption) => void;
  disabled?: boolean;
}

/**
 * Respostas rápidas fixadas acima do composer — usadas para confirmações
 * curtas (Sim/Não, Cancelar) que devem ficar sempre ao alcance do polegar,
 * mesmo com a lista de mensagens rolada para cima.
 */
export function QuickReplies({ options, onSelect, disabled }: QuickRepliesProps) {
  if (options.length === 0) return null;

  return (
    <div
      role='group'
      aria-label='Respostas rápidas'
      className='flex flex-wrap gap-2 px-3 sm:px-4 pt-2'
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type='button'
          disabled={disabled}
          onClick={() => onSelect(opt)}
          className={cn(
            'min-h-12 px-5 rounded-full border text-base font-semibold transition-colors',
            'disabled:opacity-50 disabled:pointer-events-none',
            VARIANT_CLASS[opt.variant ?? 'default'],
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
