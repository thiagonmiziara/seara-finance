import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { queueWhatsApp } from '@/lib/evolution';
import { MessageSquare, Check, Trash2 } from 'lucide-react';

const OPT_IN_VERSION = '1.0.0';

function normalizeBrazilianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function maskPhone(e164: string): string {
  // 5511987654321 -> +55 (11) 98765-4321
  const local = e164.startsWith('55') ? e164.slice(2) : e164;
  if (local.length < 10) return e164;
  const dd = local.slice(0, 2);
  const rest = local.slice(2);
  const left = rest.slice(0, rest.length - 4);
  const right = rest.slice(-4);
  return `+55 (${dd}) ${left}-${right}`;
}

export function WhatsAppSettings() {
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConnected = !!profile?.whatsappPhoneE164 && !!profile?.whatsappOptInAt;

  const connect = async (e: React.FormEvent) => {
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
      });
      try {
        await queueWhatsApp('welcome_optin', {
          first_name: user.name.split(' ')[0] ?? user.name,
        });
      } catch (err: any) {
        console.warn('[settings] welcome enqueue failed', err.message);
      }
      setPhone('');
      setOpen(false);
    } catch (err: any) {
      setError(err?.message ?? 'Não consegui salvar. Tente de novo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const disconnect = async () => {
    await updateProfile({
      whatsappPhoneE164: null,
      whatsappOptInAt: null,
      whatsappOptInVersion: null,
    });
  };

  if (loading) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <MessageSquare className='h-4 w-4' />
          {isConnected ? 'WhatsApp conectado' : 'Conectar WhatsApp'}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>WhatsApp</DialogTitle>
          <DialogDescription>
            {isConnected
              ? 'Você está recebendo mensagens automatizadas relacionadas à sua conta.'
              : 'Conecte seu número para receber lembrete de fatura, alerta de gasto e resumo no WhatsApp.'}
          </DialogDescription>
        </DialogHeader>

        {isConnected ? (
          <div className='space-y-4 py-2'>
            <div className='rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-3 flex items-center gap-3'>
              <Check className='h-5 w-5 text-blue-600 shrink-0' />
              <div className='text-sm'>
                <p className='font-medium'>
                  {maskPhone(profile!.whatsappPhoneE164!)}
                </p>
                <p className='text-xs text-muted-foreground'>
                  Conectado em{' '}
                  {profile?.whatsappOptInAt
                    ? new Date(profile.whatsappOptInAt).toLocaleDateString(
                        'pt-BR',
                      )
                    : '—'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='destructive'
                className='w-full gap-2'
                onClick={disconnect}
              >
                <Trash2 className='h-4 w-4' />
                Desconectar WhatsApp
              </Button>
            </DialogFooter>
            <p className='text-[11px] text-muted-foreground text-center'>
              Você também pode enviar <strong>SAIR</strong> no chat para parar
              de receber.
            </p>
          </div>
        ) : (
          <form onSubmit={connect} className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='phone-settings'>
                Número do WhatsApp (com DDD)
              </Label>
              <Input
                id='phone-settings'
                placeholder='Ex: 11987654321'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete='tel-national'
              />
              {error && <p className='text-xs text-red-600'>{error}</p>}
              <p className='text-[11px] text-muted-foreground'>
                Ao conectar você consente em receber mensagens automatizadas
                desta conta. Cancela a qualquer momento.
              </p>
            </div>
            <DialogFooter>
              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting ? 'Conectando...' : 'Conectar'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
