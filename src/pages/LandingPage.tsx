import { useEffect, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Wallet,
  CreditCard,
  Repeat,
  PieChart,
  Users,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import logoUrl from '@/assets/logo.png';
import { useTheme } from '@/hooks/useTheme';
import { useReveal } from '@/hooks/useReveal';

function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

function Brand({ size = 36 }: { size?: number }) {
  return (
    <div className='flex items-center gap-2.5'>
      <div
        className='flex items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-800 shadow-soft ring-1 ring-emerald-500/20 dark:ring-white/10 overflow-hidden'
        style={{ width: size, height: size }}
      >
        <img
          src={logoUrl}
          alt='Seara Finance'
          className='h-full w-full object-contain p-1.5'
        />
      </div>
      <div className='flex flex-col leading-tight'>
        <span className='font-display font-bold tracking-tight text-[15px] text-zinc-900 dark:text-zinc-100'>
          Seara Finance
        </span>
        <span className='text-[10px] uppercase tracking-[0.18em] text-zinc-400 font-medium'>
          Vida financeira
        </span>
      </div>
    </div>
  );
}

function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warn' | 'danger';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    brand: 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400',
    success:
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    warn: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    danger: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 h-6 rounded-full text-[11px] font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      aria-label='Alternar tema'
      className='h-9 w-9 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function MiniDonut({
  segments,
  size = 110,
  thickness = 14,
}: {
  segments: { color: string; value: number }[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        className='stroke-zinc-100 dark:stroke-zinc-800'
        strokeWidth={thickness}
      />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const dasharray = `${len} ${c - len}`;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill='none'
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={dasharray}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap='butt'
          />
        );
        offset += len;
        return el;
      })}
      <text
        x='50%'
        y='46%'
        textAnchor='middle'
        className='fill-zinc-400 text-[9px] uppercase font-bold tracking-wider'
      >
        Total
      </text>
      <text
        x='50%'
        y='60%'
        textAnchor='middle'
        className='fill-zinc-900 dark:fill-zinc-100 text-[13px] font-bold'
      >
        R$ 3,9k
      </text>
    </svg>
  );
}

function ScoreGauge({ value, size = 70 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const len = (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        className='stroke-zinc-100 dark:stroke-zinc-800'
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill='none'
        stroke='#22a85c'
        strokeWidth={6}
        strokeDasharray={`${len} ${c - len}`}
        strokeLinecap='round'
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x='50%'
        y='55%'
        textAnchor='middle'
        className='fill-zinc-900 dark:fill-zinc-100 text-[15px] font-extrabold'
      >
        {value}
      </text>
    </svg>
  );
}

function LandingNav({
  onLogin,
  onSignup,
}: {
  onLogin: () => void;
  onSignup: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-all duration-200',
        scrolled
          ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200/60 dark:border-zinc-800/60'
          : 'bg-transparent',
      )}
    >
      <div className='max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between'>
        <Brand size={36} />
        <nav className='hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-300'>
          <a
            href='#recursos'
            className='hover:text-zinc-900 dark:hover:text-zinc-100'
          >
            Recursos
          </a>
          <a
            href='#como-funciona'
            className='hover:text-zinc-900 dark:hover:text-zinc-100'
          >
            Como funciona
          </a>
          <a
            href='#faq'
            className='hover:text-zinc-900 dark:hover:text-zinc-100'
          >
            Dúvidas
          </a>
        </nav>
        <div className='flex items-center gap-1.5 sm:gap-2'>
          <ThemeToggle />
          <Button
            variant='ghost'
            size='sm'
            onClick={onLogin}
            className='hidden sm:inline-flex'
          >
            Entrar
          </Button>
          <Button size='sm' onClick={onSignup}>
            Acessar
          </Button>
        </div>
      </div>
    </header>
  );
}

function LandingHero({ onSignup }: { onSignup: () => void }) {
  return (
    <section className='relative overflow-hidden'>
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(34,168,92,.15), transparent 60%)',
        }}
      />
      <div className='absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-3xl pointer-events-none' />
      <div className='relative max-w-7xl mx-auto px-4 lg:px-8 pt-12 pb-16 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center'>
        <div>
          <Pill tone='brand' className='mb-5 anim-fade-up'>
            <Sparkles size={11} /> 100% gratuito
          </Pill>
          <h1
            className='font-display font-extrabold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] anim-fade-up text-zinc-900 dark:text-zinc-100'
            style={{ animationDelay: '.05s' }}
          >
            Tome o <span className='gradient-text'>controle</span> do seu
            dinheiro
            <br className='hidden md:block' /> sem complicar.
          </h1>
          <p
            className='mt-5 text-lg text-zinc-600 dark:text-zinc-300 max-w-xl leading-relaxed anim-fade-up'
            style={{ animationDelay: '.15s' }}
          >
            O Seara Finance organiza suas contas, cartões e parcelamentos em um
            só lugar. Veja para onde vai cada centavo e melhore sua saúde
            financeira mês a mês — gratuito para todos os membros.
          </p>
          <div
            className='mt-7 flex flex-wrap gap-3 anim-fade-up'
            style={{ animationDelay: '.25s' }}
          >
            <Button
              size='lg'
              onClick={onSignup}
              className='relative overflow-hidden gap-2'
            >
              <Sparkles size={16} />
              <span className='relative z-10'>Acessar gratuitamente</span>
              <span className='absolute inset-0 anim-shimmer pointer-events-none' />
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='gap-2'
              onClick={() =>
                document
                  .getElementById('como-funciona')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Ver como funciona <ArrowRight size={16} />
            </Button>
          </div>
          <div
            className='mt-7 flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400 anim-fade-up'
            style={{ animationDelay: '.35s' }}
          >
            <span className='flex items-center gap-1.5'>
              <CheckCircle2 size={14} className='text-brand-600' /> Sem custo
            </span>
            <span className='flex items-center gap-1.5'>
              <CheckCircle2 size={14} className='text-brand-600' /> 100% online
            </span>
          </div>
        </div>

        <div className='relative anim-float-slow'>
          <div className='absolute -inset-6 bg-gradient-to-br from-brand-500/20 to-transparent rounded-3xl blur-2xl' />
          <Card className='relative p-5 shadow-pop space-y-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'>
            <div
              className='rounded-xl p-4'
              style={{
                background:
                  'linear-gradient(135deg, rgba(34,168,92,.08), rgba(34,168,92,.02))',
              }}
            >
              <div className='flex items-center justify-between mb-1'>
                <p className='text-[10px] uppercase tracking-wider font-semibold text-zinc-500'>
                  Saldo do período
                </p>
                <Pill tone='success'>
                  <TrendingUp size={10} />
                  +12,4%
                </Pill>
              </div>
              <p className='font-display font-extrabold text-3xl tabular-nums text-zinc-900 dark:text-zinc-100'>
                R$ 4.559,64
              </p>
              <div className='grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60'>
                <div>
                  <p className='text-[9px] uppercase tracking-wider font-bold text-brand-700 dark:text-brand-400 flex items-center gap-1'>
                    <ArrowUp size={10} />
                    Receitas
                  </p>
                  <p className='font-bold tabular-nums text-brand-700 dark:text-brand-400 text-sm'>
                    R$ 8.500
                  </p>
                </div>
                <div>
                  <p className='text-[9px] uppercase tracking-wider font-bold text-red-600 dark:text-red-400 flex items-center gap-1'>
                    <ArrowDown size={10} />
                    Despesas
                  </p>
                  <p className='font-bold tabular-nums text-red-600 dark:text-red-400 text-sm'>
                    R$ 3.940
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className='text-xs font-semibold text-zinc-500 mb-2'>
                Por categoria
              </p>
              <div className='flex items-center gap-3'>
                <MiniDonut
                  segments={[
                    { color: '#ef4444', value: 2400 },
                    { color: '#f97316', value: 1066 },
                    { color: '#f59e0b', value: 451 },
                    { color: '#3b82f6', value: 23 },
                  ]}
                />
                <ul className='flex-1 space-y-1.5 text-xs'>
                  {[
                    ['Moradia', '#ef4444', 'R$ 2.400'],
                    ['Compras', '#f97316', 'R$ 1.066'],
                    ['Alimentação', '#f59e0b', 'R$ 451'],
                    ['Transporte', '#3b82f6', 'R$ 23'],
                  ].map(([label, color, val]) => (
                    <li
                      key={label}
                      className='flex items-center justify-between'
                    >
                      <span className='flex items-center gap-1.5'>
                        <span
                          className='h-2 w-2 rounded-full'
                          style={{ background: color as string }}
                        />
                        {label}
                      </span>
                      <span className='font-semibold tabular-nums'>{val}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
          <div className='hidden md:block absolute -left-8 bottom-10 anim-float'>
            <Card className='p-3 flex items-center gap-3 shadow-pop bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'>
              <ScoreGauge value={72} size={70} />
              <div>
                <p className='text-[10px] uppercase tracking-wider font-bold text-zinc-500'>
                  Saúde
                </p>
                <p className='font-display font-bold text-sm text-zinc-900 dark:text-zinc-100'>
                  Bom
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingTrust() {
  useReveal();
  const stats = [
    { value: '100%', label: 'gratuito' },
    { value: 'Sem', label: 'anúncios' },
    { value: 'PWA', label: 'funciona offline' },
    { value: 'Feito', label: 'com amor ♥' },
  ];
  return (
    <section className='border-y border-zinc-200/70 dark:border-zinc-800/70 bg-white/60 dark:bg-zinc-950/40'>
      <div className='max-w-7xl mx-auto px-4 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6'>
        {stats.map((s, i) => (
          <div
            key={i}
            className='text-center reveal'
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className='font-display font-extrabold text-2xl md:text-3xl text-brand-700 dark:text-brand-400 tabular-nums'>
              {s.value}
            </div>
            <div className='text-xs uppercase tracking-wider text-zinc-500 mt-1 font-semibold'>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingFeatures() {
  useReveal();
  const features = [
    {
      Icon: Wallet,
      title: 'Tudo num lugar só',
      desc: 'Receitas, despesas, parcelas e contas fixas centralizadas. Pare de pular entre 3 planilhas.',
    },
    {
      Icon: CreditCard,
      title: 'Cartões sem surpresas',
      desc: 'Acompanhe limite usado, fechamento e vencimento. Saiba o que vem na próxima fatura.',
    },
    {
      Icon: Sparkles,
      title: 'Score de saúde',
      desc: 'Pontuação inteligente baseada nos seus hábitos, com dicas para melhorar mês a mês.',
    },
    {
      Icon: Repeat,
      title: 'Contas fixas automáticas',
      desc: 'Lance aluguel, internet e assinaturas uma vez. O sistema cuida do resto todo mês.',
    },
    {
      Icon: PieChart,
      title: 'Gráficos claros',
      desc: 'Por categoria, por dia, por cartão. Visualize para onde vai cada centavo.',
    },
    {
      Icon: Users,
      title: 'Multi-conta',
      desc: 'Separe pessoal, casa e negócio. Troque com um clique, sem misturar finanças.',
    },
  ];
  return (
    <section id='recursos' className='py-16 md:py-20'>
      <div className='max-w-7xl mx-auto px-4 lg:px-8'>
        <div className='text-center max-w-2xl mx-auto mb-12 md:mb-14'>
          <Pill tone='brand' className='mb-4'>
            Recursos
          </Pill>
          <h2 className='font-display font-extrabold text-3xl md:text-4xl tracking-tight text-zinc-900 dark:text-zinc-100'>
            Tudo que você precisa para organizar sua vida financeira
          </h2>
          <p className='text-zinc-600 dark:text-zinc-300 mt-4 text-lg'>
            Sem complicação, sem planilhas, sem se perder entre apps.
          </p>
        </div>
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5'>
          {features.map((f, i) => {
            const Ic = f.Icon;
            return (
              <Card
                key={i}
                className='p-6 hover:shadow-soft hover:-translate-y-1 hover:border-brand-500/40 transition-all duration-300 reveal bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className='inline-flex h-11 w-11 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 items-center justify-center mb-4'>
                  <Ic size={20} />
                </span>
                <h3 className='font-display font-bold text-lg text-zinc-900 dark:text-zinc-100'>
                  {f.title}
                </h3>
                <p className='text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed'>
                  {f.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LandingHow() {
  useReveal();
  const steps = [
    {
      n: '01',
      title: 'Crie sua conta',
      desc: 'Login com Google em 10 segundos. Sem formulário gigante.',
    },
    {
      n: '02',
      title: 'Cadastre cartões e contas fixas',
      desc: 'O sistema já preenche os lançamentos recorrentes pra você.',
    },
    {
      n: '03',
      title: 'Acompanhe e melhore',
      desc: 'Veja seu score subir conforme você ganha controle das finanças.',
    },
  ];
  return (
    <section
      id='como-funciona'
      className='py-16 md:py-20 bg-zinc-50 dark:bg-zinc-950/60 border-y border-zinc-200/70 dark:border-zinc-800/70'
    >
      <div className='max-w-7xl mx-auto px-4 lg:px-8'>
        <div className='text-center max-w-2xl mx-auto mb-12 md:mb-14'>
          <Pill tone='brand' className='mb-4'>
            Como funciona
          </Pill>
          <h2 className='font-display font-extrabold text-3xl md:text-4xl tracking-tight text-zinc-900 dark:text-zinc-100'>
            Em 3 passos você está no controle
          </h2>
        </div>
        <div className='grid md:grid-cols-3 gap-4 md:gap-5'>
          {steps.map((s, i) => (
            <Card
              key={i}
              className='p-7 relative overflow-hidden reveal hover:-translate-y-1 hover:shadow-soft transition-all duration-300 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className='absolute -top-4 -right-2 font-display font-extrabold text-7xl text-brand-100 dark:text-brand-950/60 select-none pointer-events-none'>
                {s.n}
              </span>
              <div className='relative'>
                <span className='inline-flex h-9 px-3 rounded-full bg-brand-600 text-white text-sm font-bold items-center mb-4'>
                  Passo {s.n}
                </span>
                <h3 className='font-display font-bold text-xl text-zinc-900 dark:text-zinc-100'>
                  {s.title}
                </h3>
                <p className='text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed'>
                  {s.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingFaq() {
  const items = [
    {
      q: 'Meus dados estão seguros?',
      a: 'Sim. Usamos criptografia de ponta a ponta e Firebase com autenticação Google. Nunca pedimos sua senha do banco e não acessamos suas contas bancárias.',
    },
    {
      q: 'Preciso conectar com meu banco?',
      a: 'Não. O Seara Finance funciona com lançamentos manuais ou importação de CSV. Você mantém total controle dos dados.',
    },
    {
      q: 'É realmente gratuito?',
      a: 'Sim. O Seara Finance é gratuito, sem anúncios e sem cobrança.',
    },
    {
      q: 'Funciona no celular?',
      a: 'Sim. É um PWA — pode instalar como app no Android e iOS direto pelo navegador.',
    },
  ];
  const [open, setOpen] = useState<number>(0);
  return (
    <section id='faq' className='py-16 md:py-20'>
      <div className='max-w-3xl mx-auto px-4 lg:px-8'>
        <div className='text-center mb-12'>
          <Pill tone='brand' className='mb-4'>
            FAQ
          </Pill>
          <h2 className='font-display font-extrabold text-3xl md:text-4xl tracking-tight text-zinc-900 dark:text-zinc-100'>
            Perguntas frequentes
          </h2>
        </div>
        <div className='space-y-3'>
          {items.map((it, i) => (
            <Card
              key={i}
              className='overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className='w-full p-5 flex items-center justify-between text-left'
              >
                <span className='font-semibold text-zinc-900 dark:text-zinc-100'>
                  {it.q}
                </span>
                <ChevronDown
                  size={18}
                  className={cn(
                    'text-zinc-400 transition-transform',
                    open === i && 'rotate-180',
                  )}
                />
              </button>
              {open === i && (
                <div className='px-5 pb-5 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed anim-fade-up'>
                  {it.a}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingCTA({ onSignup }: { onSignup: () => void }) {
  useReveal();
  return (
    <section className='py-16 md:py-20'>
      <div className='max-w-5xl mx-auto px-4 lg:px-8 reveal'>
        <Card
          className='p-8 sm:p-10 lg:p-14 text-center relative overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
          style={{
            backgroundImage:
              'radial-gradient(circle at top right, rgba(34,168,92,.12), transparent 60%)',
          }}
        >
          <div className='absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-500/15 blur-3xl' />
          <div className='relative'>
            <h2 className='font-display font-extrabold text-3xl md:text-4xl lg:text-5xl tracking-tight max-w-2xl mx-auto leading-[1.1] text-zinc-900 dark:text-zinc-100'>
              Sua vida financeira merece{' '}
              <span className='text-brand-600'>mais clareza</span>.
            </h2>
            <p className='mt-5 text-zinc-600 dark:text-zinc-300 text-lg max-w-xl mx-auto'>
              Acesse agora. É gratuito e leva menos de 1 minuto.
            </p>
            <div className='mt-7 flex flex-wrap gap-3 justify-center'>
              <Button size='lg' onClick={onSignup} className='gap-2'>
                <Sparkles size={16} /> Acessar gratuitamente
              </Button>
              <Button
                size='lg'
                variant='outline'
                onClick={() =>
                  document
                    .getElementById('recursos')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Saiba mais
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className='border-t border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50 dark:bg-zinc-950/60 py-12'>
      <div className='max-w-7xl mx-auto px-4 lg:px-8 grid sm:grid-cols-2 md:grid-cols-4 gap-8'>
        <div className='md:col-span-2'>
          <Brand size={36} />
          <p className='text-sm text-zinc-500 mt-4 max-w-sm'>
            Organize suas finanças com clareza. Disponível como PWA — leve,
            rápido e funciona offline.
          </p>
        </div>
        <div>
          <p className='font-semibold text-sm mb-3 text-zinc-900 dark:text-zinc-100'>
            Produto
          </p>
          <ul className='space-y-2 text-sm text-zinc-500'>
            <li>
              <a
                href='#recursos'
                className='hover:text-zinc-900 dark:hover:text-zinc-100'
              >
                Recursos
              </a>
            </li>
            <li>
              <a
                href='#como-funciona'
                className='hover:text-zinc-900 dark:hover:text-zinc-100'
              >
                Como funciona
              </a>
            </li>
            <li>
              <a
                href='#faq'
                className='hover:text-zinc-900 dark:hover:text-zinc-100'
              >
                Dúvidas
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className='font-semibold text-sm mb-3 text-zinc-900 dark:text-zinc-100'>
            Sobre
          </p>
          <ul className='space-y-2 text-sm text-zinc-500'>
            <li>
              <a
                href='#'
                className='hover:text-zinc-900 dark:hover:text-zinc-100'
              >
                Contato
              </a>
            </li>
            <li>
              <a
                href='#'
                className='hover:text-zinc-900 dark:hover:text-zinc-100'
              >
                Privacidade
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className='max-w-7xl mx-auto px-4 lg:px-8 mt-10 pt-6 border-t border-zinc-200/70 dark:border-zinc-800/70 text-xs text-zinc-500 flex flex-wrap justify-between gap-2'>
        <span>© 2026 Seara Finance.</span>
        <span>Feito com ♥</span>
      </div>
    </footer>
  );
}

export default function LandingPage({ onSignup }: { onSignup: () => void }) {
  return (
    <div className='min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100'>
      <LandingNav onLogin={onSignup} onSignup={onSignup} />
      <LandingHero onSignup={onSignup} />
      <LandingTrust />
      <LandingFeatures />
      <LandingHow />
      <LandingFaq />
      <LandingCTA onSignup={onSignup} />
      <LandingFooter />
    </div>
  );
}
