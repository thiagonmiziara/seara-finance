import { useEffect, useMemo, useState } from 'react';
import { Plus, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, useNavigation, type NavItem } from './navigation';

const PRIMARY_IDS = ['dashboard', 'transacoes', 'cartoes'] as const;

export function MobileBottomNav() {
  const { current, navigate } = useNavigation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  const { primary, overflow } = useMemo(() => {
    const primaryItems: NavItem[] = [];
    const overflowItems: NavItem[] = [];
    for (const item of NAV_ITEMS) {
      if ((PRIMARY_IDS as readonly string[]).includes(item.id)) {
        primaryItems.push(item);
      } else {
        overflowItems.push(item);
      }
    }
    primaryItems.sort(
      (a, b) =>
        PRIMARY_IDS.indexOf(a.id as typeof PRIMARY_IDS[number]) -
        PRIMARY_IDS.indexOf(b.id as typeof PRIMARY_IDS[number]),
    );
    return { primary: primaryItems, overflow: overflowItems };
  }, []);

  const overflowActive = overflow.some((i) => i.id === current);

  // Layout: 2 items | FAB | 1 item + "Mais" quando há itens de overflow.
  const { leftItems, rightItems, hasMore } = useMemo(() => {
    const left = primary.slice(0, 2);
    if (overflow.length > 0) {
      return {
        leftItems: left,
        rightItems: primary.slice(2, 3),
        hasMore: true,
      };
    }
    return {
      leftItems: left,
      rightItems: primary.slice(2, 4),
      hasMore: false,
    };
  }, [primary, overflow.length]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheetOpen]);

  const handleNavigate = (id: NavItem['id']) => {
    navigate(id);
    setSheetOpen(false);
  };

  const handleAdd = () => {
    setPressed(true);
    window.setTimeout(() => setPressed(false), 240);

    const dispatchOpen = () => {
      window.dispatchEvent(new CustomEvent('seara:open-add-transaction'));
    };

    if (current === 'transacoes' || current === 'dashboard') {
      dispatchOpen();
      return;
    }

    navigate('transacoes');
    // Aguarda a TransactionsPage (e o modal dentro dela) montar antes de abrir.
    window.setTimeout(dispatchOpen, 220);
  };

  return (
    <>
      <nav
        aria-label='Navegação principal mobile'
        className='lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pt-1 pointer-events-none safe-area-bottom'
      >
        <div className='relative pointer-events-auto mx-auto max-w-md'>
          <div className='rounded-2xl bg-card/90 backdrop-blur-xl border border-border/60 shadow-pop'>
            <ul className='grid grid-cols-5 px-1.5 py-1.5 gap-0.5 items-stretch'>
              {leftItems.map((item) => (
                <NavTab
                  key={item.id}
                  item={item}
                  isActive={current === item.id}
                  onClick={() => handleNavigate(item.id)}
                />
              ))}

              {/* Slot central — o FAB é posicionado absolutamente sobre ele */}
              <li aria-hidden='true' className='pointer-events-none' />

              {rightItems.map((item) => (
                <NavTab
                  key={item.id}
                  item={item}
                  isActive={current === item.id}
                  onClick={() => handleNavigate(item.id)}
                />
              ))}

              {hasMore && (
                <li>
                  <button
                    type='button'
                    onClick={() => setSheetOpen(true)}
                    aria-label='Mais opções'
                    aria-haspopup='dialog'
                    className={cn(
                      'relative flex w-full flex-col items-center gap-0.5 rounded-xl py-1.5 px-2.5 transition-all duration-200 active:scale-90 select-none',
                      overflowActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'relative flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300',
                        overflowActive
                          ? 'bg-primary/15 shadow-[0_0_24px_-6px_hsl(var(--primary))]'
                          : 'bg-transparent',
                      )}
                    >
                      <MoreHorizontal
                        className={cn(
                          'h-5 w-5 transition-transform duration-300',
                          overflowActive ? 'scale-110' : 'scale-100',
                        )}
                      />
                      {overflowActive && (
                        <span className='absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary' />
                      )}
                    </span>
                    <span className='text-[10px] font-semibold leading-none whitespace-nowrap'>
                      Mais
                    </span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Botão flutuante de adicionar (FAB) — elevado e centralizado */}
          <button
            type='button'
            onClick={handleAdd}
            aria-label='Adicionar transação'
            className={cn(
              'absolute left-1/2 -top-5 -translate-x-1/2',
              'h-14 w-14 rounded-full',
              'bg-primary text-primary-foreground',
              'flex items-center justify-center',
              'shadow-[0_10px_28px_-8px_hsl(var(--primary)/0.65),0_4px_12px_-4px_hsl(var(--primary)/0.45)]',
              'ring-4 ring-background',
              'transition-all duration-200 ease-out',
              'hover:brightness-110 active:scale-90',
              pressed && 'scale-95 brightness-110',
            )}
          >
            <span
              className={cn(
                'absolute inset-0 rounded-full',
                'bg-[radial-gradient(circle_at_30%_25%,hsl(var(--primary-foreground)/0.28),transparent_60%)]',
                'opacity-80 pointer-events-none',
              )}
              aria-hidden='true'
            />
            <Plus
              className={cn(
                'relative h-7 w-7 transition-transform duration-300',
                pressed ? 'rotate-90' : 'rotate-0',
              )}
              strokeWidth={2.6}
            />
          </button>
        </div>
      </nav>

      <MoreSheet
        open={sheetOpen}
        items={overflow}
        currentId={current}
        onClose={() => setSheetOpen(false)}
        onSelect={handleNavigate}
      />
    </>
  );
}

function NavTab({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <li>
      <button
        type='button'
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'relative flex w-full flex-col items-center gap-0.5 rounded-xl py-1.5 px-2 transition-all duration-200 active:scale-90 select-none',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <span
          className={cn(
            'relative flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300',
            isActive
              ? 'bg-primary/15 shadow-[0_0_24px_-6px_hsl(var(--primary))]'
              : 'bg-transparent',
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5 transition-transform duration-300',
              isActive ? 'scale-110' : 'scale-100',
            )}
          />
          {isActive && (
            <span className='absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary' />
          )}
        </span>
        <span
          className={cn(
            'text-[10px] font-semibold leading-none whitespace-nowrap transition-opacity duration-300',
            isActive ? 'opacity-100' : 'opacity-80',
          )}
        >
          {item.shortLabel}
        </span>
      </button>
    </li>
  );
}

function MoreSheet({
  open,
  items,
  currentId,
  onClose,
  onSelect,
}: {
  open: boolean;
  items: NavItem[];
  currentId: NavItem['id'];
  onClose: () => void;
  onSelect: (id: NavItem['id']) => void;
}) {
  return (
    <div
      className={cn(
        'lg:hidden fixed inset-0 z-50 transition-opacity duration-200',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
    >
      <button
        type='button'
        aria-label='Fechar'
        onClick={onClose}
        className='absolute inset-0 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-sm'
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-label='Mais opções'
        className={cn(
          'absolute left-0 right-0 bottom-0 bg-card border-t border-border/60 rounded-t-3xl shadow-pop transition-transform duration-300 ease-out safe-area-bottom',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className='flex justify-center pt-2.5 pb-1'>
          <span className='h-1 w-10 rounded-full bg-muted-foreground/30' />
        </div>
        <div className='flex items-center justify-between px-5 pt-1 pb-3'>
          <h2 className='text-base font-semibold text-foreground'>Mais opções</h2>
          <button
            type='button'
            onClick={onClose}
            aria-label='Fechar'
            className='h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition'
          >
            <X size={18} />
          </button>
        </div>
        <ul className='grid grid-cols-3 gap-2 px-4 pb-6'>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentId === item.id;
            return (
              <li key={item.id}>
                <button
                  type='button'
                  onClick={() => onSelect(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex w-full flex-col items-center gap-2 rounded-2xl py-4 px-2 transition-all active:scale-95 border',
                    isActive
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-background/40 border-border/40 text-foreground hover:bg-muted/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      isActive ? 'bg-primary/20' : 'bg-muted/60',
                    )}
                  >
                    <Icon className='h-5 w-5' />
                  </span>
                  <span className='text-xs font-semibold leading-tight text-center'>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
