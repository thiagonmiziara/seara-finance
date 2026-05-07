import { useEffect, useState } from 'react';
import { Check, Crown, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { PLANS, type CheckoutPlan } from '@/lib/plans';
import { createCheckoutSession, createPortalSession } from '@/lib/stripe-client';
import { showToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

function readStatusFromUrl(): 'success' | 'cancel' | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  if (status === 'success' || status === 'cancel') return status;
  return null;
}

export default function BillingPage() {
  const { subscription, isPro, loading, reload } = useSubscription();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [busyPlan, setBusyPlan] = useState<CheckoutPlan | null>(null);
  const [busyPortal, setBusyPortal] = useState(false);

  useEffect(() => {
    const status = readStatusFromUrl();
    if (!status) return;
    if (status === 'success') {
      showToast({
        message: 'Pagamento confirmado! A assinatura pode levar alguns segundos para aparecer.',
        type: 'success',
      });
      // O webhook atualiza assíncrono; tentamos reload a cada 2s por ~10s.
      let tries = 0;
      const t = window.setInterval(async () => {
        tries += 1;
        await reload();
        if (tries >= 5) window.clearInterval(t);
      }, 2000);
    } else {
      showToast({ message: 'Pagamento cancelado.', type: 'info' });
    }
    // limpa querystring
    const url = new URL(window.location.href);
    url.searchParams.delete('status');
    url.searchParams.delete('session_id');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, [reload]);

  const handleSubscribe = async (plan: CheckoutPlan) => {
    setBusyPlan(plan);
    try {
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      console.error('[billing] checkout failed', err);
      showToast({
        message: 'Não foi possível iniciar o checkout. Tente novamente.',
        type: 'error',
      });
      setBusyPlan(null);
    }
  };

  const handleManage = async () => {
    setBusyPortal(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      console.error('[billing] portal failed', err);
      showToast({
        message: 'Não foi possível abrir o portal de cobrança.',
        type: 'error',
      });
      setBusyPortal(false);
    }
  };

  return (
    <div className='space-y-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='text-2xl font-bold tracking-tight'>Assinatura</h1>
        <p className='text-sm text-muted-foreground'>
          Escolha o plano que faz sentido para você. Cancele quando quiser.
        </p>
      </header>

      {/* Status atual */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Crown className='h-5 w-5 text-primary' />
            Plano atual: <span className='capitalize'>{subscription.plan}</span>
            {isPro && (
              <span className='ml-2 inline-flex items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase px-2 py-0.5'>
                {subscription.status}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {loading
              ? 'Carregando…'
              : isPro
                ? subscription.cancelAtPeriodEnd
                  ? `Cancelamento agendado: ${formatDate(subscription.currentPeriodEnd)}`
                  : `Renovação em ${formatDate(subscription.currentPeriodEnd)}`
                : 'Você está no plano Free. Faça upgrade para liberar tudo.'}
          </CardDescription>
        </CardHeader>
        {isPro && (
          <CardContent className='pt-0'>
            <Button onClick={handleManage} disabled={busyPortal} variant='outline'>
              {busyPortal ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Abrindo…
                </>
              ) : (
                <>
                  <ExternalLink className='h-4 w-4 mr-2' />
                  Gerenciar assinatura
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Toggle mensal/anual */}
      <div className='flex justify-center'>
        <div className='inline-flex rounded-lg border border-border p-1 bg-card'>
          <button
            type='button'
            onClick={() => setInterval('month')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
              interval === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Mensal
          </button>
          <button
            type='button'
            onClick={() => setInterval('year')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
              interval === 'year'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Anual <span className='ml-1 text-[10px] font-bold text-emerald-500'>-17%</span>
          </button>
        </div>
      </div>

      {/* Cards de plano */}
      <div className='grid gap-4 md:grid-cols-2'>
        {(['free', 'pro'] as const).map((id) => {
          const p = PLANS[id];
          const isCurrent = subscription.plan === id && (id === 'free' || isPro);
          const isProCard = id === 'pro';
          const price =
            interval === 'month' ? p.monthlyPriceBRL : p.yearlyPriceBRL / 12;
          const checkoutPlan: CheckoutPlan =
            interval === 'month' ? 'pro_month' : 'pro_year';

          return (
            <Card
              key={id}
              className={cn(
                'flex flex-col',
                isProCard && 'border-primary/40 ring-1 ring-primary/20',
              )}
            >
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle>{p.name}</CardTitle>
                  {isProCard && p.highlights?.[0] && (
                    <span className='inline-flex items-center rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase px-2 py-0.5'>
                      {p.highlights[0]}
                    </span>
                  )}
                </div>
                <CardDescription>{p.tagline}</CardDescription>
              </CardHeader>
              <CardContent className='flex-1 flex flex-col gap-4 pt-0'>
                <div className='flex items-baseline gap-1'>
                  <span className='text-3xl font-bold'>
                    {price === 0 ? 'Grátis' : BRL.format(price)}
                  </span>
                  {price > 0 && (
                    <span className='text-sm text-muted-foreground'>/mês</span>
                  )}
                </div>
                {isProCard && interval === 'year' && (
                  <p className='text-xs text-muted-foreground -mt-2'>
                    {BRL.format(p.yearlyPriceBRL)} cobrados anualmente
                  </p>
                )}
                <ul className='space-y-2 text-sm'>
                  {p.features.map((f) => (
                    <li key={f} className='flex items-start gap-2'>
                      <Check className='h-4 w-4 text-emerald-500 shrink-0 mt-0.5' />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className='mt-auto pt-2'>
                  {isCurrent ? (
                    <Button disabled variant='outline' className='w-full'>
                      Plano atual
                    </Button>
                  ) : id === 'free' ? (
                    isPro ? (
                      <Button onClick={handleManage} variant='outline' className='w-full'>
                        Cancelar Pro
                      </Button>
                    ) : (
                      <Button disabled variant='outline' className='w-full'>
                        Plano atual
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(checkoutPlan)}
                      disabled={busyPlan !== null}
                      className='w-full'
                    >
                      {busyPlan === checkoutPlan ? (
                        <>
                          <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                          Redirecionando…
                        </>
                      ) : isPro ? (
                        'Trocar para este plano'
                      ) : (
                        'Assinar Pro'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className='text-xs text-muted-foreground text-center'>
        Pagamento processado pela Stripe. Seus dados de cartão nunca chegam aos nossos servidores.
      </p>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
