import { useState } from 'react';
import { Sun, Moon, LogOut, Tags, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/avatar';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import InstallPwaModal from '@/components/InstallPwaModal';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, useNavigation } from './navigation';

export function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { current, navigate } = useNavigation();
  const [installOpen, setInstallOpen] = useState(false);

  return (
    <>
      <header className='sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-card/95 backdrop-blur-md px-3 sm:px-6'>
        <div className='flex items-center gap-2 lg:hidden'>
          <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-black shadow-soft overflow-hidden'>
            <img
              src='/icone.png'
              alt='Seara Finance'
              className='h-full w-full object-contain'
            />
          </div>
          <span className='font-extrabold text-base tracking-tight'>
            <span className='gradient-text'>Seara</span>
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
            onClick={() => setInstallOpen(true)}
            title='Instalar app'
            aria-label='Instalar app'
            className='rounded-full'
          >
            <Download className='h-5 w-5' />
          </Button>

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
            <UserAvatar src={user?.avatar} name={user?.name} />
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

      <InstallPwaModal open={installOpen} onOpenChange={setInstallOpen} />
    </>
  );
}
