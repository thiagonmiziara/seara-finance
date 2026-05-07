import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import {
  TermsOfServiceDialog,
  PrivacyPolicyDialog,
} from '@/components/LegalDocuments';

type Mode = 'login' | 'signup' | 'reset';

interface LoginScreenProps {
  onBack: () => void;
}

export function LoginScreen({ onBack }: LoginScreenProps) {
  const { login, signup, resetPassword, isLoggingIn, authError } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (mode === 'login') {
      try {
        await login(email, password);
      } catch {
        // erro já em authError
      }
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError('A senha precisa ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirm) {
        setLocalError('As senhas não coincidem.');
        return;
      }
      if (!name.trim()) {
        setLocalError('Conta a gente como te chamar.');
        return;
      }
      try {
        await signup(email, password, name.trim());
      } catch {
        // erro já em authError
      }
      return;
    }

    if (mode === 'reset') {
      try {
        await resetPassword(email);
        setResetSentTo(email);
      } catch {
        // authError preenchido
      }
    }
  };

  const errorMessage = localError || authError;

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
            <img
              src='/finzap-icon.svg'
              alt='Finzap'
              className='h-14 w-14 rounded-2xl shadow-card'
            />
            <span className='text-lg font-extrabold tracking-tight'>
              Finzap
            </span>
            <span className='text-xs text-muted-foreground -mt-1'>
              Controle financeiro no zap
            </span>
          </div>

          <Card className='border border-zinc-200 dark:border-zinc-800 shadow-card bg-card'>
            <CardHeader className='text-center space-y-2 pb-6'>
              <CardTitle className='font-display text-2xl font-bold tracking-tight'>
                {mode === 'login' && 'Bem-vindo de volta'}
                {mode === 'signup' && 'Crie sua conta'}
                {mode === 'reset' && 'Recuperar senha'}
              </CardTitle>
              <CardDescription className='text-sm'>
                {mode === 'login' && 'Entre para acessar seu painel financeiro'}
                {mode === 'signup' &&
                  'Em menos de 1 minuto você está controlando seu dinheiro'}
                {mode === 'reset' &&
                  'Enviamos um link de redefinição para o seu e-mail'}
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-5'>
              {resetSentTo ? (
                <div className='space-y-4 text-center'>
                  <p className='text-sm text-muted-foreground'>
                    Se houver uma conta cadastrada com{' '}
                    <strong>{resetSentTo}</strong>, enviamos um link para
                    redefinir sua senha. Confira a caixa de entrada e o spam.
                  </p>
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full'
                    onClick={() => {
                      setResetSentTo(null);
                      setMode('login');
                    }}
                  >
                    Voltar para o login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-4'>
                  {mode === 'signup' && (
                    <div className='space-y-2'>
                      <Label htmlFor='name'>Como te chamar?</Label>
                      <Input
                        id='name'
                        type='text'
                        autoComplete='name'
                        placeholder='Seu nome'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className='space-y-2'>
                    <Label htmlFor='email'>E-mail</Label>
                    <Input
                      id='email'
                      type='email'
                      autoComplete='email'
                      placeholder='voce@exemplo.com'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {mode !== 'reset' && (
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <Label htmlFor='password'>Senha</Label>
                        {mode === 'login' && (
                          <button
                            type='button'
                            className='text-xs text-primary hover:underline'
                            onClick={() => setMode('reset')}
                          >
                            Esqueci minha senha
                          </button>
                        )}
                      </div>
                      <Input
                        id='password'
                        type='password'
                        autoComplete={
                          mode === 'login'
                            ? 'current-password'
                            : 'new-password'
                        }
                        placeholder='••••••••'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div className='space-y-2'>
                      <Label htmlFor='confirm'>Confirme a senha</Label>
                      <Input
                        id='confirm'
                        type='password'
                        autoComplete='new-password'
                        placeholder='••••••••'
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                  )}

                  {errorMessage && (
                    <p className='text-sm text-red-600 dark:text-red-400'>
                      {errorMessage}
                    </p>
                  )}

                  <Button
                    type='submit'
                    size='lg'
                    className='w-full h-12 font-medium'
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn
                      ? 'Aguarde...'
                      : mode === 'login'
                        ? 'Entrar'
                        : mode === 'signup'
                          ? 'Criar conta'
                          : 'Enviar link de redefinição'}
                  </Button>

                  <div className='text-center text-xs text-muted-foreground'>
                    {mode === 'login' && (
                      <>
                        Ainda não tem conta?{' '}
                        <button
                          type='button'
                          className='text-primary hover:underline'
                          onClick={() => setMode('signup')}
                        >
                          Crie agora
                        </button>
                      </>
                    )}
                    {mode === 'signup' && (
                      <>
                        Já tem conta?{' '}
                        <button
                          type='button'
                          className='text-primary hover:underline'
                          onClick={() => setMode('login')}
                        >
                          Entrar
                        </button>
                      </>
                    )}
                    {mode === 'reset' && (
                      <>
                        Lembrou a senha?{' '}
                        <button
                          type='button'
                          className='text-primary hover:underline'
                          onClick={() => setMode('login')}
                        >
                          Voltar para o login
                        </button>
                      </>
                    )}
                  </div>

                  {mode === 'signup' && (
                    <p className='text-center text-[11px] text-muted-foreground leading-5'>
                      Ao criar a conta você concorda com os{' '}
                      <TermsOfServiceDialog /> e a <PrivacyPolicyDialog />.
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
