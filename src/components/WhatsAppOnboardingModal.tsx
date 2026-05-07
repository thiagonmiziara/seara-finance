import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { queueWhatsApp } from '@/lib/evolution';
import { MessageSquareShare } from 'lucide-react';

const OPT_IN_VERSION = '1.0.0';

function normalizeBrazilianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function WhatsAppOnboardingModal() {
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!profile) return;
    // never opened, never opted in -> prompt
    if (!profile.whatsappPhoneE164 && !profile.onboardingCompletedAt) {
      setIsOpen(true);
    }
  }, [loading, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;

    const formatted = normalizeBrazilianPhone(phone);
    if (!formatted) {
      setError('Informe um número válido com DDD.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      await updateProfile({
        whatsappPhoneE164: formatted,
        whatsappOptInAt: now,
        whatsappOptInVersion: OPT_IN_VERSION,
        onboardingCompletedAt: now,
      });
      // queue welcome message
      try {
        await queueWhatsApp('welcome_optin', {
          first_name: user.name.split(' ')[0] ?? user.name,
        });
      } catch (err: any) {
        console.warn('[onboarding] welcome enqueue failed', err.message);
      }
      setIsOpen(false);
    } catch (err: any) {
      setError(err?.message ?? 'Não consegui salvar. Tente de novo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    await updateProfile({
      onboardingCompletedAt: new Date().toISOString(),
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4'>
            <MessageSquareShare className='h-6 w-6 text-blue-600 dark:text-blue-400' />
          </div>
          <DialogTitle className='text-center'>
            Conecte o seu WhatsApp
          </DialogTitle>
          <DialogDescription className='text-center'>
            Receba lembrete de fatura, alerta de gasto e seu resumo direto no
            WhatsApp. Você pode cancelar a qualquer hora.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='phone'>Número do WhatsApp (com DDD)</Label>
            <Input
              id='phone'
              placeholder='Ex: 11987654321'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete='tel-national'
            />
            {error && <p className='text-xs text-red-600'>{error}</p>}
            <p className='text-[11px] text-muted-foreground'>
              Ao conectar você consente em receber mensagens automatizadas
              relacionadas à sua conta. Sem spam, sem repasse para terceiros.
            </p>
          </div>
          <DialogFooter className='flex-col gap-2 sm:flex-col'>
            <Button type='submit' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? 'Conectando...' : 'Conectar WhatsApp'}
            </Button>
            <Button
              type='button'
              variant='ghost'
              className='w-full text-xs text-muted-foreground'
              onClick={handleSkip}
            >
              Configurar depois
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
