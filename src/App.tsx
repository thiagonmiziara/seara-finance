import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Chrome, CheckCircle2 } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useTheme } from '@/hooks/useTheme';
import {
  TermsOfServiceDialog,
  PrivacyPolicyDialog,
} from '@/components/LegalDocuments';
import { Sun, Moon } from 'lucide-react';

function App() {
  const { isAuthenticated, login, isLoggingIn } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <div className='min-h-screen w-full relative overflow-hidden bg-background text-foreground'>
      {/* Background Layers */}
      <div className='absolute inset-0 flex transition-colors duration-500'>
        <div className='w-full lg:w-1/2 bg-zinc-50 dark:bg-zinc-900 relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-emerald-200/40 to-green-200/30 dark:from-emerald-950 dark:to-green-950' />
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] dark:opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
        </div>
        <div className='hidden lg:block lg:w-1/2 bg-white dark:bg-zinc-950' />
      </div>

      {/* Theme Toggle - Absolute Positioned */}
      <div className='absolute top-4 right-4 z-50'>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleTheme}
          className='rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800'
        >
          {theme === 'dark' ? <Sun className='h-5 w-5' /> : <Moon className='h-5 w-5 text-zinc-600' />}
        </Button>
      </div>

      {/* Content Layer */}
      <div className='relative z-20 flex min-h-screen flex-col lg:flex-row'>
        {/* Watermark Logo - Only visible in dark mode */}
        <div className='absolute -top-24 lg:-top-12 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-96 hidden dark:flex items-start justify-center pointer-events-none opacity-[0.05] lg:opacity-[0.15] z-0 px-4'>
          <img
            src={logo}
            alt=''
            className='h-full w-auto object-contain brightness-200'
            loading='eager'
          />
        </div>

        {/* Left Column - Hero/Marketing */}
        <div className='flex-1 flex flex-col justify-start pt-20 lg:pt-0 lg:justify-center p-8 lg:p-16 text-zinc-900 dark:text-white relative z-10'>
          <div className='relative z-10 max-w-xl text-center lg:text-left animate-in fade-in slide-in-from-bottom-8 duration-1000'>
            <div className='mb-8 flex items-center justify-center lg:justify-start gap-3'>
              <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-black shadow-lg ring-2 ring-emerald-500/10 dark:ring-white/5 overflow-hidden'>
                <img src="/icone.png" alt="Logo" className="h-full w-full object-contain" />
              </div>

              <h1 className='text-2xl font-bold tracking-tight text-zinc-900 dark:text-white/90'>
                Seara Finance
              </h1>
            </div>

            <h2 className='text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight'>
              Gerencie suas finanças com{' '}
              <span className='text-primary bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-500'>
                sabedoria
              </span>
              .
            </h2>

            <p className='text-lg text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0'>
              O Seara Finance ajuda você a organizar seus gastos e planejar o
              seu futuro financeiro com eficiência e clareza.
            </p>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-zinc-700 dark:text-zinc-300 max-w-md mx-auto lg:mx-0'>
              <div className='flex items-center gap-3'>
                <CheckCircle2 className='h-5 w-5 text-emerald-600 dark:text-primary' />
                <span>Controle total de fluxo</span>
              </div>
              <div className='flex items-center gap-3'>
                <CheckCircle2 className='h-5 w-5 text-emerald-600 dark:text-primary' />
                <span>Relatórios simplificados</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Login Form */}
        <div className='flex-1 flex items-center justify-center p-4 lg:p-8 relative z-10'>
          <div className='w-full max-w-md animate-in fade-in zoom-in-95 duration-700 delay-150'>
            <Card className='border border-zinc-200 dark:border-zinc-800/50 shadow-2xl lg:shadow-xl bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md'>
              <CardHeader className='text-center space-y-2 pb-6'>
                <CardTitle className='text-2xl font-bold tracking-tight'>
                  Bem-vindo de volta!
                </CardTitle>
                <CardDescription className='text-base'>
                  Entre com sua conta institucional para acessar
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-6'>
                <Button
                  type='button'
                  variant='outline'
                  size='lg'
                  className='w-full relative h-12 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border-zinc-200 dark:border-zinc-800'
                  onClick={login}
                  disabled={isLoggingIn}
                >
                  <Chrome
                    className={`mr-3 h-5 w-5 ${isLoggingIn ? 'animate-spin' : ''}`}
                  />
                  {isLoggingIn ? 'Entrando...' : 'Continuar com Google'}
                </Button>

                <div className='text-center text-xs text-muted-foreground/80 mt-2 leading-5'>
                  Ao continuar, você concorda com nossos{' '}
                  <br className='hidden sm:inline' />
                  <TermsOfServiceDialog /> e <PrivacyPolicyDialog />.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
