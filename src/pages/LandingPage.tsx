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
  ChevronDown,
  ChevronLeft,
  Sun,
  Moon,
  MessageCircle,
  Mic,
  CheckCheck,
  MoreVertical,
  Phone,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/useTheme';
import { useReveal } from '@/hooks/useReveal';

function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

function Brand({ size = 36 }: { size?: number }) {
  return (
    <div className='flex items-center gap-2.5'>
      <img
        src='/finzap-icon.svg'
        alt='Finzap'
        className='rounded-xl shadow-soft'
        style={{ width: size, height: size }}
      />
      <div className='flex flex-col leading-tight'>
        <span className='font-display font-bold tracking-tight text-[15px] text-foreground'>
          Finzap
        </span>
        <span className='text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium'>
          Controle no zap
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
      'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
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

function WhatsAppPhone() {
  return (
    <div className='relative mx-auto w-[280px] sm:w-[300px]'>
      <div className='absolute -inset-6 bg-gradient-to-br from-emerald-500/30 via-brand-500/20 to-transparent rounded-[3rem] blur-2xl pointer-events-none' />
      <div className='relative bg-zinc-900 dark:bg-zinc-950 rounded-[2.8rem] p-2.5 shadow-pop ring-1 ring-zinc-800'>
        <div className='absolute -right-1 top-24 w-1 h-12 bg-zinc-800 rounded-r-sm' />
        <div className='absolute -left-1 top-20 w-1 h-8 bg-zinc-800 rounded-l-sm' />
        <div className='absolute -left-1 top-32 w-1 h-12 bg-zinc-800 rounded-l-sm' />
        <div className='absolute top-0 left-1/2 -translate-x-1/2 z-20 bg-zinc-900 dark:bg-zinc-950 w-28 h-7 rounded-b-3xl' />
        <div className='relative bg-[#0b141a] rounded-[2.3rem] overflow-hidden flex flex-col h-[560px]'>
          <div className='flex items-center justify-between px-6 pt-3 pb-1 text-white text-[10px] font-semibold tabular-nums'>
            <span>9:41</span>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-2 border border-white rounded-sm relative'>
                <span className='absolute inset-0.5 bg-white rounded-[1px]' />
              </span>
            </span>
          </div>
          <div className='bg-[#202c33] px-3 py-2.5 flex items-center gap-2.5'>
            <ChevronLeft className='text-zinc-300 shrink-0' size={18} />
            <div className='w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0'>
              <img src='/finzap-icon.svg' alt='Finzap' className='w-9 h-9' />
            </div>
            <div className='flex-1 leading-tight min-w-0'>
              <p className='text-white text-[13px] font-semibold truncate'>
                Finzap
              </p>
              <p className='text-emerald-400 text-[10px]'>online</p>
            </div>
            <Phone className='text-zinc-300 shrink-0' size={16} />
            <MoreVertical className='text-zinc-300 shrink-0' size={16} />
          </div>
          <div className='flex-1 px-2.5 py-3 space-y-1.5 overflow-hidden bg-[#0b141a]'>
            <div className='flex justify-center mb-1'>
              <span className='bg-[#1f2c33] text-zinc-400 text-[9px] font-semibold px-2 py-0.5 rounded'>
                HOJE
              </span>
            </div>
            <div className='flex justify-end'>
              <div className='bg-[#005c4b] rounded-lg rounded-tr-sm px-2.5 py-1.5 max-w-[80%] shadow-sm'>
                <p className='text-white text-[12px] leading-snug'>
                  almoço 35
                </p>
                <p className='text-zinc-300/70 text-[9px] text-right mt-0.5 flex items-center justify-end gap-0.5'>
                  14:32{' '}
                  <CheckCheck size={11} className='text-sky-400' />
                </p>
              </div>
            </div>
            <div className='flex justify-start'>
              <div className='bg-[#202c33] rounded-lg rounded-tl-sm px-2.5 py-1.5 max-w-[88%] shadow-sm'>
                <p className='text-white text-[12px] leading-snug'>
                  ✅ Lançado<br />
                  <span className='text-zinc-300'>Almoço — </span>
                  <span className='text-white font-semibold'>R$ 35,00</span>
                  <br />
                  <span className='text-emerald-400 text-[11px]'>
                    📂 Alimentação
                  </span>
                </p>
                <p className='text-zinc-400 text-[9px] text-right mt-0.5'>
                  14:32
                </p>
              </div>
            </div>
            <div className='flex justify-end pt-1'>
              <div className='bg-[#005c4b] rounded-lg rounded-tr-sm px-2.5 py-1.5 max-w-[80%] shadow-sm'>
                <p className='text-white text-[12px] leading-snug'>
                  quanto gastei esse mês?
                </p>
                <p className='text-zinc-300/70 text-[9px] text-right mt-0.5 flex items-center justify-end gap-0.5'>
                  14:33{' '}
                  <CheckCheck size={11} className='text-sky-400' />
                </p>
              </div>
            </div>
            <div className='flex justify-start'>
              <div className='bg-[#202c33] rounded-lg rounded-tl-sm px-2.5 py-1.5 max-w-[90%] shadow-sm'>
                <p className='text-white text-[12px] leading-snug'>
                  📊 <span className='font-semibold'>Resumo de Maio</span>
                  <br />
                  <span className='text-zinc-300'>Despesas: </span>
                  <span className='text-red-400 font-semibold'>R$ 3.940</span>
                  <br />
                  <span className='text-zinc-300'>Receitas: </span>
                  <span className='text-emerald-400 font-semibold'>
                    R$ 8.500
                  </span>
                  <br />
                  <span className='text-zinc-300'>Saldo: </span>
                  <span className='text-white font-bold'>R$ 4.560</span>
                </p>
                <p className='text-zinc-400 text-[9px] text-right mt-0.5'>
                  14:33
                </p>
              </div>
            </div>
          </div>
          <div className='bg-[#202c33] px-2 py-2 flex items-center gap-2'>
            <div className='flex-1 bg-[#2a3942] rounded-full px-3 py-1.5'>
              <span className='text-zinc-500 text-[11px]'>Mensagem</span>
            </div>
            <div className='w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shadow'>
              <Mic size={16} className='text-white' />
            </div>
          </div>
        </div>
      </div>
    </div>
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
            href='#planos'
            className='hover:text-zinc-900 dark:hover:text-zinc-100'
          >
            Planos
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
            'radial-gradient(ellipse at top right, rgba(33,75,148,.15), transparent 60%)',
        }}
      />
      <div className='absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-3xl pointer-events-none' />
      <div className='relative max-w-7xl mx-auto px-4 lg:px-8 pt-12 pb-16 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
        <div>
          <Pill tone='success' className='mb-5 anim-fade-up'>
            <MessageCircle size={11} /> Integrado com WhatsApp
          </Pill>
          <h1
            className='font-display font-extrabold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] anim-fade-up text-zinc-900 dark:text-zinc-100'
            style={{ animationDelay: '.05s' }}
          >
            Suas finanças no{' '}
            <span className='gradient-text'>WhatsApp</span>.
            <br className='hidden md:block' /> Sem abrir app.
          </h1>
          <p
            className='mt-5 text-lg text-zinc-600 dark:text-zinc-300 max-w-xl leading-relaxed anim-fade-up'
            style={{ animationDelay: '.15s' }}
          >
            Mande uma mensagem do tipo <strong>"almoço 35"</strong> e o
            Finzap lança, categoriza e organiza. Pergunte quanto gastou,
            consulte cartões e contas — tudo direto do chat. O app fica para
            quando você quiser ver os gráficos.
          </p>
          <div
            className='mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3 anim-fade-up'
            style={{ animationDelay: '.25s' }}
          >
            <Button
              size='lg'
              onClick={onSignup}
              className='relative overflow-hidden gap-2 w-full sm:w-auto'
            >
              <Sparkles size={16} />
              <span className='relative z-10'>Começar agora</span>
              <span className='absolute inset-0 anim-shimmer pointer-events-none' />
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='gap-2 w-full sm:w-auto'
              onClick={() =>
                document
                  .getElementById('planos')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Ver planos <ArrowRight size={16} />
            </Button>
          </div>
          <div
            className='mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400 anim-fade-up'
            style={{ animationDelay: '.35s' }}
          >
            <span className='flex items-center gap-1.5'>
              <CheckCircle2 size={14} className='text-brand-600' /> A partir de
              R$ 16,66/mês
            </span>
            <span className='flex items-center gap-1.5'>
              <CheckCircle2 size={14} className='text-brand-600' /> Cancele
              quando quiser
            </span>
          </div>
        </div>

        <div className='relative anim-float-slow flex justify-center lg:justify-end'>
          <WhatsAppPhone />
        </div>
      </div>
    </section>
  );
}

function LandingTrust() {
  useReveal();
  const stats = [
    { value: 'WhatsApp', label: 'integração nativa' },
    { value: '< 5s', label: 'para lançar um gasto' },
    { value: 'PWA', label: 'funciona offline' },
    { value: 'Auto', label: 'categorização inteligente' },
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

function LandingPricing({ onSignup }: { onSignup: () => void }) {
  useReveal();
  const [annual, setAnnual] = useState(true);
  const features = [
    'Lançamentos ilimitados via WhatsApp',
    'Categorização automática inteligente',
    'Cartões, contas e parcelamentos',
    'Contas fixas com automação',
    'Score de saúde financeira',
    'Gráficos e relatórios completos',
    'Multi-conta (pessoal, casa, negócio)',
    'Suporte por WhatsApp',
  ];
  return (
    <section
      id='planos'
      className='py-16 md:py-20 bg-zinc-50 dark:bg-zinc-950/60 border-y border-zinc-200/70 dark:border-zinc-800/70'
    >
      <div className='max-w-5xl mx-auto px-4 lg:px-8'>
        <div className='text-center max-w-2xl mx-auto mb-10'>
          <Pill tone='brand' className='mb-4'>
            Planos
          </Pill>
          <h2 className='font-display font-extrabold text-3xl md:text-4xl tracking-tight text-zinc-900 dark:text-zinc-100'>
            Um plano simples. Tudo incluído.
          </h2>
          <p className='text-zinc-600 dark:text-zinc-300 mt-4 text-lg'>
            Escolha mensal ou economize 16% no anual.
          </p>
        </div>
        <div className='flex justify-center mb-8'>
          <div className='inline-flex p-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800/70'>
            <button
              type='button'
              onClick={() => setAnnual(false)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                !annual
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400',
              )}
            >
              Mensal
            </button>
            <button
              type='button'
              onClick={() => setAnnual(true)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2',
                annual
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400',
              )}
            >
              Anual
              <span className='text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold'>
                -16%
              </span>
            </button>
          </div>
        </div>
        <div className='grid md:grid-cols-2 gap-5 max-w-3xl mx-auto'>
          <Card className='p-7 reveal bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-soft transition-all'>
            <p className='text-xs uppercase tracking-wider font-bold text-zinc-500'>
              Mensal
            </p>
            <div className='mt-3 flex items-baseline gap-1'>
              <span className='font-display font-extrabold text-4xl text-zinc-900 dark:text-zinc-100 tabular-nums'>
                R$ 19,90
              </span>
              <span className='text-zinc-500 text-sm'>/mês</span>
            </div>
            <p className='text-sm text-zinc-500 mt-1'>
              Cobrança mensal. Cancele quando quiser.
            </p>
            <Button
              variant='outline'
              className='w-full mt-5'
              onClick={onSignup}
            >
              Começar mensal
            </Button>
            <ul className='mt-6 space-y-2.5 text-sm'>
              {features.map((f) => (
                <li
                  key={f}
                  className='flex items-start gap-2 text-zinc-700 dark:text-zinc-300'
                >
                  <CheckCircle2
                    size={16}
                    className='text-brand-600 mt-0.5 shrink-0'
                  />
                  {f}
                </li>
              ))}
            </ul>
          </Card>
          <Card
            className='p-7 reveal relative bg-white dark:bg-zinc-900 border-2 border-brand-500 shadow-pop hover:shadow-pop transition-all'
            style={{ transitionDelay: '80ms' }}
          >
            <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
              <span className='inline-flex items-center gap-1 bg-brand-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-soft uppercase tracking-wider'>
                <Sparkles size={11} /> Mais escolhido
              </span>
            </div>
            <p className='text-xs uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400'>
              Anual
            </p>
            <div className='mt-3 flex items-baseline gap-1'>
              <span className='font-display font-extrabold text-4xl text-zinc-900 dark:text-zinc-100 tabular-nums'>
                R$ 16,66
              </span>
              <span className='text-zinc-500 text-sm'>/mês</span>
            </div>
            <p className='text-sm text-zinc-500 mt-1'>
              R$ 199,90/ano · economize R$ 38,90
            </p>
            <Button className='w-full mt-5 gap-2' onClick={onSignup}>
              <Sparkles size={16} /> Começar anual
            </Button>
            <ul className='mt-6 space-y-2.5 text-sm'>
              {features.map((f) => (
                <li
                  key={f}
                  className='flex items-start gap-2 text-zinc-700 dark:text-zinc-300'
                >
                  <CheckCircle2
                    size={16}
                    className='text-brand-600 mt-0.5 shrink-0'
                  />
                  {f}
                </li>
              ))}
              <li className='flex items-start gap-2 font-semibold text-brand-700 dark:text-brand-400'>
                <Zap size={16} className='text-brand-600 mt-0.5 shrink-0' />
                2 meses grátis
              </li>
            </ul>
          </Card>
        </div>
        <p className='text-center text-xs text-zinc-500 mt-6'>
          Pagamento seguro · Pix, cartão e boleto · Sem fidelidade ·{' '}
          <span className='text-zinc-400'>
            (plano selecionado: <strong>{annual ? 'Anual' : 'Mensal'}</strong>)
          </span>
        </p>
      </div>
    </section>
  );
}

function LandingFaq() {
  const items = [
    {
      q: 'Como funciona a integração com WhatsApp?',
      a: 'Após criar sua conta, você conecta seu número e ganha um contato do Finzap no WhatsApp. Mande mensagens como "uber 28" ou "salário 5000" e ele lança, categoriza e responde com confirmação. Também pode pedir resumos: "quanto gastei essa semana?".',
    },
    {
      q: 'Meus dados estão seguros?',
      a: 'Sim. Usamos criptografia, Firebase com autenticação Google e jamais pedimos sua senha do banco. Não acessamos suas contas bancárias — você é quem decide o que registrar.',
    },
    {
      q: 'Quanto custa e como pago?',
      a: 'R$ 19,90/mês ou R$ 199,90/ano (equivale a R$ 16,66/mês — economia de 16%). Aceitamos Pix, cartão e boleto. Sem fidelidade — cancele quando quiser.',
    },
    {
      q: 'Posso usar sem o WhatsApp?',
      a: 'Sim. O app web/PWA funciona completo — WhatsApp é só um atalho para quem não quer abrir o app o tempo todo.',
    },
    {
      q: 'Funciona no celular?',
      a: 'Sim. É um PWA — pode instalar como app no Android e iOS direto pelo navegador, e funciona offline.',
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
              'radial-gradient(circle at top right, rgba(33,75,148,.12), transparent 60%)',
          }}
        >
          <div className='absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-500/15 blur-3xl' />
          <div className='relative'>
            <h2 className='font-display font-extrabold text-3xl md:text-4xl lg:text-5xl tracking-tight max-w-2xl mx-auto leading-[1.1] text-zinc-900 dark:text-zinc-100'>
              Pare de abrir app pra anotar gasto.{' '}
              <span className='text-brand-600'>Manda no zap</span>.
            </h2>
            <p className='mt-5 text-zinc-600 dark:text-zinc-300 text-lg max-w-xl mx-auto'>
              A partir de R$ 16,66/mês no plano anual. Cancele quando quiser.
            </p>
            <div className='mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:justify-center'>
              <Button
                size='lg'
                onClick={onSignup}
                className='gap-2 w-full sm:w-auto'
              >
                <Sparkles size={16} /> Começar agora
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='w-full sm:w-auto'
                onClick={() =>
                  document
                    .getElementById('planos')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Ver planos
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

function LandingFooter() {
  const linkClass =
    'text-zinc-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors';
  return (
    <footer className='relative border-t border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50 dark:bg-zinc-950/60 overflow-hidden'>
      <div
        className='absolute inset-0 pointer-events-none opacity-60'
        style={{
          background:
            'radial-gradient(ellipse at top left, rgba(33,75,148,.08), transparent 55%)',
        }}
      />
      <div className='relative max-w-7xl mx-auto px-4 lg:px-8 py-12 md:py-14'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10'>
          <div className='col-span-2 md:col-span-2'>
            <Brand size={36} />
            <p className='text-sm text-zinc-500 dark:text-zinc-400 mt-4 max-w-sm leading-relaxed'>
              Organize suas finanças com clareza. Disponível como PWA — leve,
              rápido e funciona offline.
            </p>
            <div className='mt-5 flex flex-wrap gap-2'>
              <Pill tone='success'>
                <MessageCircle size={11} /> WhatsApp nativo
              </Pill>
              <Pill tone='brand'>
                <Sparkles size={11} /> A partir de R$ 16,66/mês
              </Pill>
            </div>
          </div>
          <div>
            <p className='font-semibold text-sm mb-3 text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]'>
              Produto
            </p>
            <ul className='space-y-2.5 text-sm'>
              <li>
                <a href='#recursos' className={linkClass}>
                  Recursos
                </a>
              </li>
              <li>
                <a href='#como-funciona' className={linkClass}>
                  Como funciona
                </a>
              </li>
              <li>
                <a href='#planos' className={linkClass}>
                  Planos
                </a>
              </li>
              <li>
                <a href='#faq' className={linkClass}>
                  Dúvidas
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className='font-semibold text-sm mb-3 text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]'>
              Sobre
            </p>
            <ul className='space-y-2.5 text-sm'>
              <li>
                <a href='#' className={linkClass}>
                  Contato
                </a>
              </li>
              <li>
                <a href='#' className={linkClass}>
                  Privacidade
                </a>
              </li>
              <li>
                <a href='#' className={linkClass}>
                  Termos
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className='mt-10 pt-6 border-t border-zinc-200/70 dark:border-zinc-800/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400'>
          <span className='font-medium'>© 2026 Finzap. Todos os direitos reservados.</span>
          <span className='flex items-center gap-1.5'>
            Feito com <span className='text-red-500'>♥</span> no Brasil
          </span>
        </div>
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
      <LandingPricing onSignup={onSignup} />
      <LandingFaq />
      <LandingCTA onSignup={onSignup} />
      <LandingFooter />
    </div>
  );
}
