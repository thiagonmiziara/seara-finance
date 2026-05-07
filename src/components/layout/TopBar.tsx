import { Sun, Moon, LogOut, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import { WhatsAppSettings } from '@/components/WhatsAppSettings';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, useNavigation } from './navigation';

export function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { current, navigate } = useNavigation();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
    : 'U';

  return (
    <>
      <header className='sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-card/95 backdrop-blur-md px-3 sm:px-6'>
        <div className='flex items-center gap-2 lg:hidden'>
          <img
            src='/finzap-icon.svg'
            alt='Finzap'
            className='h-9 w-9 rounded-lg shadow-soft'
          />
          <span className='font-extrabold text-base tracking-tight'>
            Finzap
          </span>
        </div>

        <div className='hidden lg:flex flex-col leading-tight'>
          <span className='text-xs uppercase tracking-widest text-muted-foreground font-semibold'>
            {NAV_ITEMS.find((i) => i.id === current)?.label ?? 'Dashboard'}
          </span>
          <span className='text-sm font-semibold text-foreground'>
            Olá, {user?.name?.split(' ')[0] ?? 'usuário'} 👋
          </span>
        </div>

        <div className='ml-auto flex items-center gap-1 sm:gap-3'>
          <div className='hidden sm:block'>
            <AccountSwitcher />
          </div>

          <div className='hidden md:block'>
            <WhatsAppSettings />
          </div>

          <button
            type='button'
            onClick={() => navigate('categorias')}
            className={cn(
              'hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors',
              current === 'categorias' && 'bg-primary/10 text-primary',
            )}
            title='Categorias'
            aria-label='Categorias'
          >
            <Tags className='h-[18px] w-[18px]' />
          </button>

          <Button
            variant='ghost'
            size='icon'
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            className='rounded-full'
          >
            {theme === 'dark' ? (
              <Sun className='h-5 w-5' />
            ) : (
              <Moon className='h-5 w-5' />
            )}
          </Button>

          <div className='flex items-center gap-2'>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className='h-9 w-9 rounded-full object-cover ring-2 ring-border'
              />
            ) : (
              <div className='h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm'>
                {initials}
              </div>
            )}
          </div>

          <Button
            variant='ghost'
            size='icon'
            onClick={logout}
            title='Sair'
            className='rounded-full'
          >
            <LogOut className='h-5 w-5' />
          </Button>
        </div>
      </header>

      <div className='sm:hidden px-3 py-2 border-b border-border/50 bg-card/80 backdrop-blur-md flex justify-center'>
        <AccountSwitcher />
      </div>
    </>
  );
}
