import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  ChevronRight,
  Download,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
} from 'date-fns';
import { useFinance } from '@/hooks/useFinance';
import { useProjectedTransactions } from '@/hooks/useProjectedTransactions';
import { useDebts } from '@/hooks/useDebts';
import { getDebtStatusInfo } from '@/lib/debtStatus';
import { CalendarClock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FlowChart } from '@/components/FlowChart';
import { CategoryDonut } from '@/components/CategoryDonut';
import { ScorePanel } from '@/components/ScorePanel';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { ImportCSVModal } from '@/components/ImportCSVModal';
import { SegmentedPeriodFilter } from '@/components/layout/SegmentedPeriodFilter';
import { usePeriod } from '@/components/layout/period-context';
import { useNavigation, NAV_ITEMS } from '@/components/layout/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES as STATIC_CATEGORIES } from '@/lib/categories';
import { useCategories } from '@/hooks/useCategories';
import { Transaction } from '@/types';
import { cn } from '@/lib/utils';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatShort(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}k`;
  return formatCurrency(value);
}

function summarize(txs: Transaction[]) {
  return txs.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.income += t.amount;
        acc.balance += t.amount;
      } else {
        acc.expense += t.amount;
        acc.balance -= t.amount;
      }
      return acc;
    },
    { income: 0, expense: 0, balance: 0 },
  );
}

function inRange(t: Transaction, from: Date, to: Date) {
  if (!t.date) return false;
  const d = parseISO(t.date.includes('T') ? t.date : `${t.date}T00:00:00`);
  return d.getTime() >= from.getTime() && d.getTime() <= to.getTime();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { dateRange, selectedMonthLabel, period } = usePeriod();
  const {
    dashboardTransactions: realDashboard,
    allTransactions,
    addTransaction,
    addTransactionsBatch,
    addTransfer,
    exportToCSV: rawExportToCSV,
    isAdding,
    isInitialLoading,
  } = useFinance(dateRange);
  const projected = useProjectedTransactions(
    dateRange ?? {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
    allTransactions,
  );
  const { navigate } = useNavigation();
  const { categories: dyn } = useCategories();
  const allCats = dyn.length > 0 ? dyn : STATIC_CATEGORIES;
  const { debts } = useDebts();

  const [hideValue, setHideValue] = useState(false);

  // Sum of installmentAmount for parcels due in the current calendar month
  // that are not yet paid. Drives the "Parcelas do mês" KPI on the dashboard.
  const monthInstallmentsTotal = useMemo(() => {
    return debts.reduce((acc, d) => {
      const info = getDebtStatusInfo(d);
      if (
        (info.status === 'a_pagar' || info.status === 'em_atraso') &&
        info.monthInstallmentNumber !== null
      ) {
        return acc + d.installmentAmount;
      }
      return acc;
    }, 0);
  }, [debts]);
  const monthInstallmentsCount = useMemo(() => {
    return debts.filter((d) => {
      const info = getDebtStatusInfo(d);
      return (
        (info.status === 'a_pagar' || info.status === 'em_atraso') &&
        info.monthInstallmentNumber !== null
      );
    }).length;
  }, [debts]);

  const dashboardTransactions = useMemo<Transaction[]>(
    () => [...realDashboard, ...projected].sort((a, b) => b.date.localeCompare(a.date)),
    [realDashboard, projected],
  );

  const summary = useMemo(() => summarize(dashboardTransactions), [dashboardTransactions]);

  // Delta vs previous calendar month — computed from `allTransactions`
  // so it stays meaningful regardless of selected period.
  const delta = useMemo(() => {
    if (period !== 'current') return null;
    const now = new Date();
    const currStart = startOfMonth(now);
    const currEnd = endOfMonth(now);
    const prevStart = startOfMonth(subMonths(now, 1));
    const prevEnd = endOfMonth(subMonths(now, 1));
    const curr = summarize(allTransactions.filter((t) => inRange(t, currStart, currEnd)));
    const prev = summarize(allTransactions.filter((t) => inRange(t, prevStart, prevEnd)));
    if (prev.balance === 0) return null;
    const pct = ((curr.balance - prev.balance) / Math.abs(prev.balance)) * 100;
    return pct;
  }, [allTransactions, period]);

  const last5 = useMemo(() => dashboardTransactions.slice(0, 5), [dashboardTransactions]);

  const shortcutItems = NAV_ITEMS.filter(
    (n) => n.id !== 'dashboard' && n.id !== 'categorias',
  );

  const firstName = user?.name?.split(' ')[0] ?? 'usuário';

  return (
    <div className='space-y-6'>
      {/* Greeting + period filter + new transaction CTA */}
      <header className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <p className='text-sm text-muted-foreground'>Olá, {firstName} 👋</p>
          <h1 className='text-3xl sm:text-4xl font-extrabold tracking-tight font-display mt-0.5'>
            Resumo de {selectedMonthLabel}
          </h1>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
          <SegmentedPeriodFilter />
          <AddTransactionModal
            onAddTransaction={addTransaction}
            onAddTransfer={addTransfer}
            isAdding={isAdding}
            className='w-full sm:w-auto'
          />
        </div>
      </header>

      {/* 2x2 grid: hero + score, flow + category */}
      <div className='grid gap-4 lg:grid-cols-3'>
        {/* Hero balance */}
        <section
          className={cn(
            'lg:col-span-2 relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card p-6',
            'brand-gradient',
          )}
        >
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <div className='flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                <span>Saldo do período</span>
                <button
                  type='button'
                  onClick={() => setHideValue((h) => !h)}
                  className='p-1 rounded-full hover:bg-muted transition-colors'
                  aria-label={hideValue ? 'Mostrar saldo' : 'Ocultar saldo'}
                >
                  {hideValue ? <EyeOff className='h-3.5 w-3.5' /> : <Eye className='h-3.5 w-3.5' />}
                </button>
              </div>
              {isInitialLoading ? (
                <Skeleton className='h-12 w-56 mt-3' />
              ) : (
                <div className='mt-2 flex items-end gap-3 flex-wrap'>
                  <span
                    className={cn(
                      'text-4xl sm:text-5xl font-extrabold tabular-nums tracking-tight leading-none',
                      summary.balance >= 0 ? 'text-foreground' : 'text-red-500',
                    )}
                  >
                    {hideValue ? '••••••' : formatCurrency(summary.balance)}
                  </span>
                  {delta !== null && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        delta >= 0
                          ? 'bg-primary/15 text-primary'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400',
                      )}
                    >
                      {delta >= 0 ? '↑' : '↓'} {delta >= 0 ? '+' : ''}
                      {delta.toFixed(1)}% vs mês passado
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='my-5 h-px w-full bg-border/60' />

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <div className='inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                <span className='inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary'>
                  <ArrowUpRight className='h-3 w-3' />
                </span>
                Receitas
              </div>
              <div className='mt-1 text-2xl font-extrabold tabular-nums text-primary truncate'>
                {hideValue ? '••••' : formatShort(summary.income)}
              </div>
            </div>
            <div>
              <div className='inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                <span className='inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15 text-red-500'>
                  <ArrowDownLeft className='h-3 w-3' />
                </span>
                Despesas
              </div>
              <div className='mt-1 text-2xl font-extrabold tabular-nums text-red-500 truncate'>
                {hideValue ? '••••' : formatShort(summary.expense)}
              </div>
            </div>
          </div>
        </section>

        {/* Score panel */}
        <section className='lg:col-span-1'>
          <ScorePanel />
        </section>

        {/* Flow chart */}
        <section className='lg:col-span-2'>
          {isInitialLoading ? (
            <Skeleton className='h-[360px] rounded-2xl' />
          ) : (
            <FlowChart transactions={dashboardTransactions} />
          )}
        </section>

        {/* Category donut */}
        <section className='lg:col-span-1'>
          {isInitialLoading ? (
            <Skeleton className='h-[360px] rounded-2xl' />
          ) : (
            <CategoryDonut transactions={dashboardTransactions} />
          )}
        </section>
      </div>

      {/* Parcelas do mês — KPI compacto */}
      {monthInstallmentsCount > 0 && (
        <section>
          <button
            type='button'
            onClick={() => navigate('dividas')}
            className='w-full flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 p-4 transition-colors text-left'
          >
            <div className='flex items-center gap-3 min-w-0'>
              <span className='inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0'>
                <CalendarClock className='h-5 w-5' />
              </span>
              <div className='min-w-0'>
                <div className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
                  Parcelas do mês
                </div>
                <div className='text-lg sm:text-xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400 truncate'>
                  {hideValue ? '••••' : formatCurrency(monthInstallmentsTotal)}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {monthInstallmentsCount}{' '}
                  {monthInstallmentsCount === 1 ? 'parcela a pagar' : 'parcelas a pagar'}
                </div>
              </div>
            </div>
            <ChevronRight className='h-4 w-4 text-muted-foreground shrink-0' />
          </button>
        </section>
      )}

      {/* Shortcuts */}
      <section>
        <h2 className='text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3'>
          Atalhos
        </h2>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
          {shortcutItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type='button'
                onClick={() => navigate(item.id)}
                className='group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-card transition-all text-left'
              >
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors shrink-0'>
                  <Icon className='h-5 w-5' />
                </span>
                <span className='flex-1 text-sm font-semibold text-foreground truncate'>
                  {item.label}
                </span>
                <ChevronRight className='h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all' />
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick utilities (Import / Export) — keeps parity with the old Dashboard */}
      <section className='flex flex-col sm:flex-row gap-2'>
        <ImportCSVModal
          onAddTransactionsBatch={addTransactionsBatch}
          className='w-full sm:w-auto'
        />
        <Button
          variant='outline'
          className='w-full sm:w-auto bg-background/50 border-border/50'
          onClick={() => rawExportToCSV(dashboardTransactions)}
        >
          <Download className='mr-2 h-4 w-4' />
          Exportar CSV
        </Button>
      </section>

      {/* Last transactions */}
      <section>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-lg font-bold tracking-tight'>Últimas transações</h2>
          <button
            type='button'
            onClick={() => navigate('transacoes')}
            className='text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1'
          >
            Ver todas
            <ChevronRight className='h-3.5 w-3.5' />
          </button>
        </div>

        {isInitialLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-14 w-full' />
            <Skeleton className='h-14 w-full' />
            <Skeleton className='h-14 w-full' />
          </div>
        ) : last5.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground'>
            Sem transações neste período.
          </div>
        ) : (
          <ul className='divide-y divide-border/50 rounded-2xl border border-border/60 bg-card overflow-hidden shadow-card'>
            {last5.map((t) => {
              const cat = allCats.find((c) => c.value === t.category);
              const isExpense = t.type === 'expense';
              return (
                <li key={t.id} className='flex items-center gap-3 px-4 py-3'>
                  <span
                    className='h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0'
                    style={{ backgroundColor: cat?.color ?? (isExpense ? '#ef4444' : '#2563eb') }}
                  >
                    {(cat?.label ?? t.category ?? '?').slice(0, 1).toUpperCase()}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='font-medium truncate'>{t.description}</div>
                    <div className='text-xs text-muted-foreground truncate'>
                      {cat?.label ?? t.category} ·{' '}
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'text-sm font-bold tabular-nums shrink-0',
                      isExpense ? 'text-red-500' : 'text-primary',
                    )}
                  >
                    {isExpense ? '-' : '+'}
                    {formatCurrency(t.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
