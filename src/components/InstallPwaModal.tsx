import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Chrome,
  Share,
  Plus,
  Download,
  CheckCircle2,
  Smartphone,
  MoreVertical,
  Monitor,
} from 'lucide-react';
import logoUrl from '@/assets/logo.png';

type DeviceKey = 'android' | 'iphone' | 'computer';

interface Step {
  icon: React.ReactNode;
  text: React.ReactNode;
}

interface DeviceContent {
  label: string;
  subtitle: string;
  steps: Step[];
  frame: 'phone' | 'desktop';
}

const ICON_BOX =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400';

const DEVICES: Record<DeviceKey, DeviceContent> = {
  android: {
    label: 'Android',
    subtitle: 'Instale pelo Google Chrome no celular Android.',
    frame: 'phone',
    steps: [
      {
        icon: <Chrome size={18} />,
        text: (
          <>
            Abra o <b>Seara Finance</b> no <b>Google Chrome</b>
          </>
        ),
      },
      {
        icon: <MoreVertical size={18} />,
        text: (
          <>
            Toque no menu <b>⋮</b> no canto superior direito
          </>
        ),
      },
      {
        icon: <Download size={18} />,
        text: (
          <>
            Escolha <b>“Instalar app”</b> ou <b>“Adicionar à tela inicial”</b>
          </>
        ),
      },
      {
        icon: <Plus size={18} />,
        text: (
          <>
            Toque em <b>“Instalar”</b>
          </>
        ),
      },
      {
        icon: <CheckCircle2 size={18} />,
        text: (
          <>
            Pronto! O app fica disponível na <b>tela inicial</b> do celular
          </>
        ),
      },
    ],
  },
  iphone: {
    label: 'iPhone',
    subtitle: 'No iPhone, use o Safari para adicionar à tela de início.',
    frame: 'phone',
    steps: [
      {
        icon: <Smartphone size={18} />,
        text: (
          <>
            Abra o <b>Seara Finance</b> no <b>Safari</b>
          </>
        ),
      },
      {
        icon: <Share size={18} />,
        text: (
          <>
            Toque no botão de <b>compartilhar</b>
          </>
        ),
      },
      {
        icon: <Plus size={18} />,
        text: (
          <>
            Selecione <b>“Adicionar à Tela de Início”</b>
          </>
        ),
      },
      {
        icon: <CheckCircle2 size={18} />,
        text: (
          <>
            Toque em <b>“Adicionar”</b>
          </>
        ),
      },
      {
        icon: <CheckCircle2 size={18} />,
        text: (
          <>
            Pronto! O app aparecerá na <b>tela inicial</b> do iPhone
          </>
        ),
      },
    ],
  },
  computer: {
    label: 'Computador',
    subtitle: 'Instale pelo Google Chrome ou Microsoft Edge.',
    frame: 'desktop',
    steps: [
      {
        icon: <Chrome size={18} />,
        text: (
          <>
            Abra o <b>Seara Finance</b> no <b>Google Chrome</b> ou{' '}
            <b>Microsoft Edge</b>
          </>
        ),
      },
      {
        icon: <Download size={18} />,
        text: (
          <>
            Na barra de endereço, clique no <b>ícone de instalação</b>
          </>
        ),
      },
      {
        icon: <Plus size={18} />,
        text: (
          <>
            Clique em <b>“Instalar”</b>
          </>
        ),
      },
      {
        icon: <Monitor size={18} />,
        text: <>O sistema será aberto em uma janela própria</>,
      },
      {
        icon: <CheckCircle2 size={18} />,
        text: (
          <>
            Se quiser, fixe o app na <b>barra de tarefas</b> para acessar mais
            rápido
          </>
        ),
      },
    ],
  },
};

function PhoneMockup() {
  return (
    <div className='mx-auto w-[180px] sm:w-[200px] aspect-[9/19] rounded-[2rem] border-[6px] border-zinc-900 dark:border-zinc-700 bg-gradient-to-br from-brand-50 to-white dark:from-zinc-900 dark:to-zinc-950 shadow-xl relative overflow-hidden'>
      <div className='absolute top-2 left-1/2 -translate-x-1/2 h-4 w-16 rounded-full bg-zinc-900 dark:bg-zinc-700' />
      <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 px-4'>
        <div className='h-14 w-14 rounded-2xl bg-white dark:bg-zinc-900 shadow-md flex items-center justify-center ring-1 ring-brand-500/20'>
          <img
            src={logoUrl}
            alt='Seara Finance'
            className='h-9 w-9 object-contain'
          />
        </div>
        <div className='text-center'>
          <p className='font-display font-bold text-sm text-zinc-900 dark:text-zinc-100'>
            Seara Finance
          </p>
          <p className='text-[10px] text-zinc-500'>Vida financeira</p>
        </div>
        <div className='w-full space-y-1.5'>
          <div className='h-1.5 rounded-full bg-brand-500/60' />
          <div className='h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 w-3/4' />
          <div className='h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 w-1/2' />
        </div>
      </div>
    </div>
  );
}

function DesktopMockup() {
  return (
    <div className='mx-auto w-full max-w-[320px]'>
      <div className='rounded-t-xl border border-b-0 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 px-3 py-2 flex items-center gap-1.5'>
        <span className='h-2.5 w-2.5 rounded-full bg-red-400' />
        <span className='h-2.5 w-2.5 rounded-full bg-amber-400' />
        <span className='h-2.5 w-2.5 rounded-full bg-emerald-400' />
        <div className='ml-2 h-4 flex-1 rounded bg-white dark:bg-zinc-800' />
      </div>
      <div className='rounded-b-xl border border-zinc-300 dark:border-zinc-700 bg-gradient-to-br from-brand-50 to-white dark:from-zinc-900 dark:to-zinc-950 p-5 shadow-xl'>
        <div className='flex items-center gap-2 mb-4'>
          <div className='h-9 w-9 rounded-lg bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center ring-1 ring-brand-500/20'>
            <img
              src={logoUrl}
              alt='Seara Finance'
              className='h-6 w-6 object-contain'
            />
          </div>
          <div>
            <p className='font-display font-bold text-xs text-zinc-900 dark:text-zinc-100'>
              Seara Finance
            </p>
            <p className='text-[9px] text-zinc-500'>Vida financeira</p>
          </div>
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <div className='h-12 rounded-md bg-white dark:bg-zinc-800 shadow-sm' />
          <div className='h-12 rounded-md bg-white dark:bg-zinc-800 shadow-sm' />
        </div>
        <div className='mt-2 h-16 rounded-md bg-white dark:bg-zinc-800 shadow-sm' />
      </div>
    </div>
  );
}

interface InstallPwaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccess?: () => void;
}

export default function InstallPwaModal({
  open,
  onOpenChange,
  onAccess,
}: InstallPwaModalProps) {
  const [tab, setTab] = useState<DeviceKey>('android');
  const active = DEVICES[tab];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl p-0 overflow-hidden bg-white dark:bg-zinc-950'>
        <div className='p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800'>
          <DialogHeader>
            <DialogTitle className='font-display text-2xl text-zinc-900 dark:text-zinc-100'>
              Como instalar o Seara Finance
            </DialogTitle>
            <DialogDescription className='text-zinc-600 dark:text-zinc-400'>
              Escolha seu dispositivo e siga o passo a passo para instalar o
              app. Você pode usar o Seara Finance no celular ou computador com
              mais agilidade.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className='px-6 pt-4'>
          <div
            role='tablist'
            className='grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900'
          >
            {(Object.keys(DEVICES) as DeviceKey[]).map((key) => {
              const isActive = key === tab;
              return (
                <button
                  key={key}
                  role='tab'
                  aria-selected={isActive}
                  onClick={() => setTab(key)}
                  className={[
                    'h-10 rounded-lg text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
                  ].join(' ')}
                >
                  {DEVICES[key].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className='px-6 py-6 max-h-[60vh] overflow-y-auto'>
          <p className='text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-6'>
            {active.subtitle}
          </p>

          <div className='grid md:grid-cols-2 gap-6 items-center'>
            <div className='order-2 md:order-1'>
              <ol className='space-y-3'>
                {active.steps.map((step, i) => (
                  <li
                    key={i}
                    className='flex items-start gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3'
                  >
                    <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-bold'>
                      {i + 1}
                    </span>
                    <span className={ICON_BOX}>{step.icon}</span>
                    <span className='flex-1 text-sm text-zinc-700 dark:text-zinc-300 leading-snug pt-1.5'>
                      {step.text}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className='order-1 md:order-2'>
              {active.frame === 'phone' ? <PhoneMockup /> : <DesktopMockup />}
              <p className='mt-3 text-center text-xs text-zinc-500'>
                Instalado, o Seara Finance funciona como um app — mais leve e
                prático no dia a dia.
              </p>
            </div>
          </div>
        </div>

        <div className='px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between gap-3'>
          <Button
            variant='outline'
            onClick={() => {
              onOpenChange(false);
              onAccess?.();
            }}
          >
            Acessar sistema
          </Button>
          <Button onClick={() => onOpenChange(false)}>Entendi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
