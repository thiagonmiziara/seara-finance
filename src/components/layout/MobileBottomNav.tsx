import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { NAV_ITEMS, isAdminEmail, useNavigation } from './navigation';

export function MobileBottomNav() {
  const { current, navigate } = useNavigation();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLUListElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const visibleItems = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) => !item.adminOnly || isAdminEmail(user?.email),
      ),
    [user?.email],
  );

  useEffect(() => {
    const btn = itemRefs.current[current];
    const list = scrollRef.current;
    if (!btn || !list) return;
    const btnRect = btn.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (btnRect.left < listRect.left || btnRect.right > listRect.right) {
      btn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [current]);

  return (
    <nav
      aria-label='Navegação principal mobile'
      className='lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pt-1 pointer-events-none safe-area-bottom'
    >
      <div className='pointer-events-auto mx-auto max-w-md rounded-2xl bg-card/90 backdrop-blur-xl border border-border/60 shadow-pop overflow-hidden'>
        <ul
          ref={scrollRef}
          className='flex gap-0.5 px-1.5 py-1.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory'
        >
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = current === item.id;
            return (
              <li
                key={item.id}
                className='snap-center shrink-0'
              >
                <button
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                  type='button'
                  onClick={() => navigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 px-2.5 min-w-[64px] transition-all duration-200 active:scale-90 select-none',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'relative flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300',
                      isActive
                        ? 'bg-primary/15 shadow-[0_0_24px_-6px_var(--primary)]'
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
                      <span className='absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary animate-in zoom-in-50 fade-in duration-300' />
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
          })}
        </ul>
      </div>
    </nav>
  );
}
