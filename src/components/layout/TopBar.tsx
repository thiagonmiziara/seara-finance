import { useState } from 'react';
import { Menu, X, Sun, Moon, LogOut, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, useNavigation } from './navigation';

export function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { current, navigate } = useNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <button
          type='button'
          onClick={() => setMobileMenuOpen((v) => !v)}
          className='lg:hidden p-2 rounded-lg hover:bg-muted'
          aria-label='Abrir menu'
        >
          {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
        </button>

        <div className='flex items-center gap-2 lg:hidden'>
          <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-black shadow-soft overflow-hidden'>
            <img src='/icone.png' alt='Seara Finance' className='h-full w-full object-contain' />
          </div>
          <span className='font-extrabold text-base tracking-tight'>Seara</span>
        </div>

        <div className='hidden lg:flex flex-col leading-tight'>
          <span className='text-xs uppercase tracking-widest text-muted-foreground font-semibold'>
            {NAV_ITEMS.find((i) => i.id === current)?.label ?? 'Dashboard'}
          </span>
          <span className='text-sm font-semibold text-foreground'>
            Olá, {user?.name?.split(' ')[0] ?? 'usuário'} 👋
          </span>
        </div>

        <div className='ml-auto flex items-center gap-2 sm:gap-3'>
          <div className='hidden sm:block'>
            <AccountSwitcher />
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
            {theme === 'dark' ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5' />}
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

      {mobileMenuOpen && (
        <div
          className='lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200'
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className='absolute top-0 left-0 h-full w-72 bg-card border-r border-border shadow-pop p-4 flex flex-col gap-1 animate-in slide-in-from-left duration-200'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center gap-2 px-2 py-2 mb-2'>
              <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-black overflow-hidden'>
                <img src='/icone.png' alt='Seara Finance' className='h-full w-full object-contain' />
              </div>
              <span className='font-extrabold text-base tracking-tight'>Seara Finance</span>
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = current === item.id;
              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => {
                    navigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className='h-5 w-5' />
                  {item.label}
                </button>
              );
            })}
          </aside>
        </div>
      )}
    </>
  );
}
