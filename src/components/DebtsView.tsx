import { useMemo, useState } from 'react';
import { useDebts } from '@/hooks/useDebts';
import { useCards } from '@/hooks/useCards';
import { usePeriod } from '@/components/layout/period-context';
import { AddDebtModal } from '@/components/AddDebtModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCurrency } from '@/components/ui/animated-currency';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Trash2,
  Check,
  CheckCheck,
  Flag,
  ListChecks,
  RotateCcw,
  Search,
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Debt, DebtFormValues, DebtPayment } from '@/types';
import { getDebtStatusInfo } from '@/lib/debtStatus';

function fmtBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface KpiCardProps {
  label: string;
  value: number;
  tone: 'neutral' | 'success' | 'danger' | 'warning';
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
  isLoading?: boolean;
}

function KpiCard({ label, value, tone, icon: Icon, hint, isLoading }: KpiCardProps) {
  const toneStyles = {
    neutral: {
      iconWrap: 'bg-muted text-muted-foreground',
      value: 'text-foreground',
    },
    success: {
      iconWrap: 'bg-primary/15 text-primary',
      value: 'text-primary',
    },
    danger: {
      iconWrap: 'bg-red-500/15 text-red-500',
      value: 'text-red-500',
    },
    warning: {
      iconWrap: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      value: 'text-amber-600 dark:text-amber-400',
    },
  }[tone];

  return (
    <div className='rounded-2xl border border-border/60 bg-card shadow-card p-4 sm:p-5'>
      <div className='flex items-start justify-between gap-2'>
        <span className='text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
          {label}
        </span>
        <span
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg',
            toneStyles.iconWrap,
          )}
        >
          <Icon className='h-4 w-4' />
        </span>
      </div>
      <AnimatedCurrency
        value={value}
        isLoading={isLoading}
        className={cn(
          'mt-2 block text-2xl font-extrabold tabular-nums tracking-tight',
          toneStyles.value,
        )}
      />
      {hint && (
        <div className='mt-1 text-[11px] text-muted-foreground'>{hint}</div>
      )}
    </div>
  );
}

interface DebtCardProps {
  debt: Debt;
  cardName?: string;
  onIncrement: () => Promise<any>;
  onSettle: () => Promise<any>;
  onDelete: () => Promise<any>;
  onUpdate: (vars: { id: string; data: Partial<DebtFormValues> }) => Promise<any>;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

function DebtCard({
  debt,
  cardName,
  onIncrement,
  onSettle,
  onDelete,
  onUpdate,
  isDeleting,
  isUpdating,
}: DebtCardProps) {
  const passed =
    debt.status === 'pago'
      ? debt.installments
      : debt.paidInstallments || 0;
  const remaining = debt.installments - passed;
  const progress = Math.round((passed / debt.installments) * 100);
  const paidAmount = passed * debt.installmentAmount;
  const remainingAmount = Math.max(0, debt.totalAmount - paidAmount);
  const statusInfo = getDebtStatusInfo(debt);
  const { status } = statusInfo;
  const isPaid = status === 'quitada';
  const firstDue = debt.dueDate ? parseISO(debt.dueDate) : null;
  const statusLabel =
    status === 'quitada'
      ? 'Quitada'
      : status === 'paga_mes'
        ? 'Paga'
        : status === 'em_atraso'
          ? 'Em atraso'
          : 'A pagar';
  const statusPillClass =
    status === 'quitada' || status === 'paga_mes'
      ? 'bg-primary/15 text-primary'
      : status === 'em_atraso'
        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
        : 'bg-sky-500/15 text-sky-600 dark:text-sky-400';
  const iconWrapClass =
    status === 'quitada' || status === 'paga_mes'
      ? 'bg-primary/15 text-primary'
      : status === 'em_atraso'
        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
        : 'bg-sky-500/15 text-sky-600 dark:text-sky-400';
  const progressBarClass =
    status === 'quitada' || status === 'paga_mes'
      ? 'bg-primary'
      : status === 'em_atraso'
        ? 'bg-red-500'
        : 'bg-sky-500';

  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border/60 bg-card shadow-card p-4 sm:p-5 transition-all',
        isPaid ? 'opacity-70 hover:opacity-90' : 'hover:border-primary/40',
      )}
    >
      {/* Header */}
      <div className='flex items-start gap-3'>
        <span
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-xl shrink-0',
            iconWrapClass,
          )}
        >
          {isPaid ? (
            <CheckCircle2 className='h-5 w-5' />
          ) : (
            <Flag className='h-5 w-5' />
          )}
        </span>

        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h3 className='font-semibold text-foreground capitalize truncate'>
              {debt.description}
            </h3>
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
                statusPillClass,
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className='text-xs text-muted-foreground mt-0.5 truncate'>
            {cardName ? `${cardName} · ` : ''}
            1ª venc:{' '}
            {firstDue ? format(firstDue, 'dd/MM/yyyy', { locale: ptBR }) : '-'}
          </p>
        </div>

        <div className='shrink-0 -mr-1 -mt-1 flex items-center gap-0.5'>
          <AddDebtModal
            debt={debt}
            onUpdateDebt={onUpdate}
            isUpdating={isUpdating}
          />
          <ConfirmDialog
            trigger={
              <button
                type='button'
                className='inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors'
                aria-label={`Excluir dívida ${debt.description}`}
              >
                <Trash2 className='h-4 w-4' />
              </button>
            }
            title='Excluir dívida?'
            description={`A dívida "${debt.description}" será removida permanentemente.`}
            onConfirm={onDelete}
            isLoading={isDeleting}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className='grid grid-cols-3 gap-2 mt-4'>
        <div>
          <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
            Total
          </div>
          <div className='text-sm sm:text-[15px] font-extrabold tabular-nums mt-0.5 truncate'>
            {fmtBRL(debt.totalAmount)}
          </div>
        </div>
        <div>
          <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
            Parcela
          </div>
          <div className='text-sm sm:text-[15px] font-extrabold tabular-nums mt-0.5 truncate'>
            {fmtBRL(debt.installmentAmount)}
          </div>
        </div>
        <div>
          <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
            {remaining > 0 ? `Restam ${remaining}x` : 'Status'}
          </div>
          <div className='text-sm sm:text-[15px] font-extrabold tabular-nums mt-0.5 truncate'>
            {remaining > 0 ? `${debt.installments}x` : 'Paga'}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className='mt-4 space-y-1.5'>
        <div className='flex items-center justify-between text-[11px] font-semibold'>
          <span className='text-muted-foreground'>
            Progresso · {passed}/{debt.installments}
          </span>
          <span className='text-foreground tabular-nums'>{progress}%</span>
        </div>
        <div className='h-2 w-full bg-muted rounded-full overflow-hidden'>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              progressBarClass,
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className='flex items-center justify-between text-[11px] text-muted-foreground tabular-nums'>
          <span>{fmtBRL(paidAmount)} pagos</span>
          <span>{fmtBRL(remainingAmount)} restantes</span>
        </div>
      </div>

      {/* Actions */}
      {!isPaid && (
        <div className='flex flex-col sm:flex-row gap-2 mt-4'>
          <Button
            type='button'
            variant='secondary'
            size='sm'
            className='flex-1 bg-primary/10 hover:bg-primary/15 text-primary border-0'
            onClick={() => onIncrement()}
          >
            <Check className='mr-1.5 h-4 w-4' />
            Pagar parcela
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='flex-1'
              >
                <CheckCheck className='mr-1.5 h-4 w-4' />
                Quitar tudo
              </Button>
            }
            title='Quitar dívida?'
            description={`Todas as ${debt.installments} parcelas de "${debt.description}" serão marcadas como pagas.`}
            confirmLabel='Quitar'
            destructive={false}
            onConfirm={onSettle}
          />
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: React.ReactNode }) {
  return (
    <div className='rounded-2xl border border-dashed border-border/60 bg-card/50 p-10 text-center'>
      <div className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4'>
        <Wallet className='h-6 w-6' />
      </div>
      <h3 className='font-bold text-base'>Sem dívidas cadastradas</h3>
      <p className='text-sm text-muted-foreground mt-1 max-w-sm mx-auto'>
        Cadastre parcelamentos, financiamentos e empréstimos para acompanhar
        progresso e quitação.
      </p>
      <div className='mt-4 inline-block'>{onAdd}</div>
    </div>
  );
}

type DebtTab = 'ativas' | 'quitadas' | 'parcelas';

interface PaymentEntry {
  debt: Debt;
  payment: DebtPayment;
  cardName?: string;
}

interface PaymentRowProps {
  entry: PaymentEntry;
  onUndo?: () => Promise<any> | void;
  isUndoing?: boolean;
  canUndo: boolean;
}

function PaymentRow({ entry, onUndo, isUndoing, canUndo }: PaymentRowProps) {
  const { debt, payment, cardName } = entry;
  const paidDate = payment.paidAt ? parseISO(payment.paidAt) : null;
  return (
    <div className='flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-card'>
      <div className='flex items-center gap-3 min-w-0'>
        <span className='inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0'>
          <Check className='h-5 w-5' />
        </span>
        <div className='min-w-0'>
          <h4 className='font-semibold text-foreground capitalize truncate'>
            {debt.description}
          </h4>
          <p className='text-xs text-muted-foreground truncate'>
            {cardName ? `${cardName} · ` : ''}
            Parcela {payment.installmentNumber}/{debt.installments}
            {paidDate
              ? ` · ${format(paidDate, "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}`
              : ''}
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2 shrink-0'>
        <span className='text-base sm:text-lg font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400'>
          {fmtBRL(payment.amount)}
        </span>
        {canUndo && onUndo && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
            disabled={isUndoing}
            aria-label='Desfazer pagamento'
            title='Desfazer pagamento'
            onClick={() => onUndo()}
          >
            <RotateCcw className='h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  count?: number;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function TabButton({
  active,
  onClick,
  count,
  icon: Icon,
  children,
}: TabButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      title={typeof children === 'string' ? children : undefined}
      className={cn(
        'flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded-full border px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-soft'
          : 'border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-primary/40',
      )}
    >
      <Icon className='h-3.5 w-3.5 shrink-0' />
      <span className='truncate min-w-0'>{children}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums',
            active
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function DebtsView() {
  const {
    debts,
    addDebt,
    updateDebt,
    removeDebt,
    incrementInstallment,
    settleDebt,
    unmarkLastInstallment,
    summary,
    isAdding,
    isUpdating,
    isDeleting,
    isInitialLoading,
  } = useDebts();
  const { cards } = useCards();
  const { dateRange, selectedMonthLabel } = usePeriod();

  const [tab, setTab] = useState<DebtTab>('ativas');
  const [search, setSearch] = useState('');

  const cardName = (cardId?: string) =>
    cardId ? cards.find((c) => c.id === cardId)?.name : undefined;

  const matchesSearch = (debt: Debt) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    if (debt.description.toLowerCase().includes(q)) return true;
    const cName = cardName(debt.cardId)?.toLowerCase();
    return cName ? cName.includes(q) : false;
  };

  const activeDebts = useMemo(
    () =>
      debts.filter((d) => d.status !== 'pago').filter(matchesSearch),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debts, search, cards],
  );
  const settledDebts = useMemo(
    () => debts.filter((d) => d.status === 'pago').filter(matchesSearch),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debts, search, cards],
  );

  const allPayments: PaymentEntry[] = useMemo(() => {
    const entries: PaymentEntry[] = [];
    for (const debt of debts) {
      if (!matchesSearch(debt)) continue;
      const history = debt.paymentHistory ?? [];
      for (const payment of history) {
        entries.push({ debt, payment, cardName: cardName(debt.cardId) });
      }
    }
    return entries.sort(
      (a, b) =>
        new Date(b.payment.paidAt).getTime() -
        new Date(a.payment.paidAt).getTime(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debts, search, cards]);

  const periodPayments = useMemo(() => {
    if (!dateRange) return allPayments;
    return allPayments.filter((entry) => {
      try {
        const d = parseISO(entry.payment.paidAt);
        return isWithinInterval(d, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        });
      } catch {
        return false;
      }
    });
  }, [allPayments, dateRange]);

  const periodPaidTotal = useMemo(
    () => periodPayments.reduce((sum, e) => sum + e.payment.amount, 0),
    [periodPayments],
  );

  const counts = {
    ativas: activeDebts.length,
    quitadas: settledDebts.length,
    parcelas: periodPayments.length,
  };

  return (
    <div className='space-y-6 anim-fade-up'>
      {/* Header */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between flex-wrap'>
        <div className='min-w-0'>
          <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight font-display'>
            Dívidas
          </h2>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Controle parcelamentos, financiamentos e empréstimos.
          </p>
        </div>
        <AddDebtModal onAddDebt={addDebt} isAdding={isAdding} />
      </div>

      {/* KPIs */}
      <div className='grid gap-3 grid-cols-2 md:grid-cols-4'>
        <KpiCard
          label='Parcelas do mês'
          value={summary.monthlyPayment}
          tone='warning'
          icon={CalendarClock}
          hint='Soma das parcelas das dívidas em aberto'
          isLoading={isInitialLoading}
        />
        <KpiCard
          label='Total contratado'
          value={summary.total}
          tone='neutral'
          icon={Wallet}
          isLoading={isInitialLoading}
        />
        <KpiCard
          label='Restante a pagar'
          value={summary.remaining}
          tone='danger'
          icon={AlertCircle}
          isLoading={isInitialLoading}
        />
        <KpiCard
          label='Já quitado'
          value={summary.paid}
          tone='success'
          icon={CheckCircle2}
          isLoading={isInitialLoading}
        />
      </div>

      {/* Tabs + filter */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2 w-full sm:w-auto sm:flex-1 min-w-0'>
          <TabButton
            active={tab === 'ativas'}
            onClick={() => setTab('ativas')}
            count={counts.ativas}
            icon={Flag}
          >
            Ativas
          </TabButton>
          <TabButton
            active={tab === 'quitadas'}
            onClick={() => setTab('quitadas')}
            count={counts.quitadas}
            icon={CheckCircle2}
          >
            Quitadas
          </TabButton>
          <TabButton
            active={tab === 'parcelas'}
            onClick={() => setTab('parcelas')}
            count={counts.parcelas}
            icon={ListChecks}
          >
            Parcelas pagas
          </TabButton>
        </div>
        <div className='relative w-full sm:max-w-xs'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar por dívida ou cartão...'
            className='pl-9'
          />
        </div>
      </div>

      {/* Tab body */}
      {isInitialLoading ? (
        <div className='grid gap-3 grid-cols-1 lg:grid-cols-2'>
          <Skeleton className='h-[220px] rounded-2xl' />
          <Skeleton className='h-[220px] rounded-2xl' />
        </div>
      ) : tab === 'ativas' ? (
        debts.length === 0 ? (
          <EmptyState
            onAdd={<AddDebtModal onAddDebt={addDebt} isAdding={isAdding} />}
          />
        ) : activeDebts.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-border/60 bg-card/50 p-10 text-center'>
            <p className='text-sm text-muted-foreground'>
              {search
                ? 'Nenhuma dívida ativa corresponde ao filtro.'
                : 'Sem dívidas ativas — todas estão quitadas.'}
            </p>
          </div>
        ) : (
          <div className='grid gap-3 grid-cols-1 lg:grid-cols-2'>
            {activeDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                cardName={cardName(debt.cardId)}
                onIncrement={() => incrementInstallment(debt)}
                onSettle={() => settleDebt(debt)}
                onDelete={() => removeDebt(debt.id)}
                onUpdate={updateDebt}
                isDeleting={isDeleting}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )
      ) : tab === 'quitadas' ? (
        settledDebts.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-border/60 bg-card/50 p-10 text-center'>
            <div className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4'>
              <CheckCircle2 className='h-6 w-6' />
            </div>
            <h3 className='font-bold text-base'>Nenhuma dívida quitada</h3>
            <p className='text-sm text-muted-foreground mt-1 max-w-sm mx-auto'>
              {search
                ? 'Nenhuma dívida quitada corresponde ao filtro.'
                : 'Quando você quitar uma dívida, ela aparecerá aqui.'}
            </p>
          </div>
        ) : (
          <div className='grid gap-3 grid-cols-1 lg:grid-cols-2'>
            {settledDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                cardName={cardName(debt.cardId)}
                onIncrement={() => incrementInstallment(debt)}
                onSettle={() => settleDebt(debt)}
                onDelete={() => removeDebt(debt.id)}
                onUpdate={updateDebt}
                isDeleting={isDeleting}
                isUpdating={isUpdating}
              />
            ))}
          </div>
        )
      ) : (
        <div className='space-y-3'>
          <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-card p-4 shadow-card'>
            <div>
              <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                Total pago em {selectedMonthLabel}
              </div>
              <div className='mt-1 text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400'>
                {fmtBRL(periodPaidTotal)}
              </div>
            </div>
            <div className='text-xs text-muted-foreground'>
              {periodPayments.length}{' '}
              {periodPayments.length === 1
                ? 'parcela registrada'
                : 'parcelas registradas'}
            </div>
          </div>
          {periodPayments.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-border/60 bg-card/50 p-10 text-center'>
              <div className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4'>
                <ListChecks className='h-6 w-6' />
              </div>
              <h3 className='font-bold text-base'>
                Nenhuma parcela paga no período
              </h3>
              <p className='text-sm text-muted-foreground mt-1 max-w-sm mx-auto'>
                Marque parcelas como pagas para ver o histórico aqui. Parcelas
                pagas antes desta atualização não estão registradas.
              </p>
            </div>
          ) : (
            <div className='space-y-2'>
              {periodPayments.map((entry, idx) => {
                // Only allow undo on the most recent payment of each debt
                const isMostRecent =
                  entry.debt.paymentHistory &&
                  entry.payment.installmentNumber ===
                    (entry.debt.paidInstallments || 0);
                return (
                  <PaymentRow
                    key={`${entry.debt.id}-${entry.payment.installmentNumber}-${idx}`}
                    entry={entry}
                    canUndo={!!isMostRecent}
                    onUndo={
                      isMostRecent
                        ? () => unmarkLastInstallment(entry.debt)
                        : undefined
                    }
                    isUndoing={isUpdating}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
