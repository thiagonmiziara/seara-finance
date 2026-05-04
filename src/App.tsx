import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useTheme } from '@/hooks/useTheme';
import {
  TermsOfServiceDialog,
  PrivacyPolicyDialog,
} from '@/components/LegalDocuments';
import LandingPage from '@/pages/LandingPage';

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox='0 0 24 24' aria-hidden='true'>
    <path
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
      fill='#4285F4'
    />
    <path
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
      fill='#34A853'
    />
    <path
      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
      fill='#FBBC05'
    />
    <path
      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z'
      fill='#EA4335'
    />
  </svg>
);

function LoginScreen({ onBack }: { onBack: () => void }) {
  const { login, isLoggingIn } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className='min-h-screen w-full relative overflow-hidden bg-background text-foreground'>
      <div className='absolute top-4 right-4 z-50'>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleTheme}
          className='rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800'
          aria-label='Alternar tema'
        >
          {theme === 'dark' ? (
            <Sun className='h-5 w-5' />
          ) : (
            <Moon className='h-5 w-5 text-zinc-600' />
          )}
        </Button>
      </div>

      <div className='absolute top-4 left-4 z-50'>
        <Button
          variant='ghost'
          size='sm'
          onClick={onBack}
          className='gap-2'
          aria-label='Voltar'
        >
          <ArrowLeft className='h-4 w-4' /> Voltar
        </Button>
      </div>

      <div className='flex min-h-screen items-center justify-center px-6 py-12'>
        <div className='w-full max-w-md animate-in fade-in zoom-in-95 duration-500'>
          <div className='mb-6 flex flex-col items-center gap-3'>
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-800 shadow-soft ring-1 ring-emerald-500/20 dark:ring-white/10 overflow-hidden'>
              <img
                src={logo}
                alt='Seara Finance'
                className='h-full w-full object-contain p-1.5'
              />
            </div>
            <span className='text-base font-bold tracking-tight'>
              Seara Finance
            </span>
          </div>

          <Card className='border border-zinc-200 dark:border-zinc-800 shadow-card bg-card'>
            <CardHeader className='text-center space-y-2 pb-6'>
              <CardTitle className='font-display text-2xl font-bold tracking-tight'>
                Bem-vindo de volta
              </CardTitle>
              <CardDescription className='text-sm'>
                Entre para acessar sua dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-5'>
              <Button
                type='button'
                variant='outline'
                size='lg'
                className='w-full h-12 font-medium relative overflow-hidden'
                onClick={login}
                disabled={isLoggingIn}
              >
                <span className='relative z-10 flex items-center justify-center'>
                  <GoogleIcon className='mr-3 h-5 w-5' />
                  {isLoggingIn ? 'Entrando...' : 'Continuar com Google'}
                </span>
                <span className='absolute inset-0 anim-shimmer pointer-events-none' />
              </Button>

              <p className='text-center text-xs text-muted-foreground leading-5'>
                Ao continuar, você concorda com os{' '}
                <TermsOfServiceDialog /> e a <PrivacyPolicyDialog />.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (isAuthenticated) {
    return <AppShell />;
  }

  if (showLogin) {
    return <LoginScreen onBack={() => setShowLogin(false)} />;
  }

  return <LandingPage onSignup={() => setShowLogin(true)} />;
}

export default App;
