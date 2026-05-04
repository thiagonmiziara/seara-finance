import { cn } from '@/lib/utils';
import { NAV_ITEMS, useNavigation } from './navigation';

export function MobileBottomNav() {
  const { current, navigate } = useNavigation();

  // Mobile keeps the 5 most-used items; "Categorias" lives in the topbar menu.
  const mobileItems = NAV_ITEMS.filter((item) => item.id !== 'categorias');

  return (
    <nav
      aria-label='Navegação principal mobile'
      className='lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/60 safe-area-bottom shadow-pop'
    >
      <ul className='grid grid-cols-5 gap-0.5 px-1 pt-1.5'>
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.id;
          return (
            <li key={item.id}>
              <button
                type='button'
                onClick={() => navigate(item.id)}
                className={cn(
                  'w-full flex flex-col items-center gap-0.5 rounded-lg py-1.5 px-1 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={cn(
                    'flex h-8 w-12 items-center justify-center rounded-full transition-all',
                    isActive ? 'bg-primary/15' : 'bg-transparent',
                  )}
                >
                  <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                </span>
                <span className='text-[10px] font-semibold leading-none'>
                  {item.shortLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
