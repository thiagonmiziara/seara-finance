import { useDebts } from '@/hooks/useDebts';
import { useCards } from '@/hooks/useCards';
import { AddDebtModal } from '@/components/AddDebtModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Trash2,
  Check,
  CheckCheck,
  Flag,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Debt, DebtFormValues } from '@/types';

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
}

function KpiCard({ label, value, tone, icon: Icon, hint }: KpiCardProps) {
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
      <div
        className={cn(
          'mt-2 text-2xl font-extrabold tabular-nums tracking-tight',
          toneStyles.value,
        )}
      >
        {fmtBRL(value)}
      </div>
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
  const isPaid = debt.status === 'pago' || remaining === 0;
  const firstDue = debt.dueDate ? parseISO(debt.dueDate) : null;

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
            isPaid
              ? 'bg-primary/15 text-primary'
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
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
                isPaid
                  ? 'bg-primary/15 text-primary'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
              )}
            >
              {isPaid ? 'Quitada' : 'Pagando'}
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
              isPaid ? 'bg-primary' : 'bg-amber-500',
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

export default function DebtsView() {
  const {
    debts,
    addDebt,
    updateDebt,
    removeDebt,
    incrementInstallment,
    settleDebt,
    summary,
    isAdding,
    isUpdating,
    isDeleting,
    isInitialLoading,
  } = useDebts();
  const { cards } = useCards();

  const cardName = (cardId?: string) =>
    cardId ? cards.find((c) => c.id === cardId)?.name : undefined;

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
      {isInitialLoading ? (
        <div className='grid gap-3 grid-cols-2 md:grid-cols-4'>
          <Skeleton className='h-[110px] rounded-2xl' />
          <Skeleton className='h-[110px] rounded-2xl' />
          <Skeleton className='h-[110px] rounded-2xl' />
          <Skeleton className='h-[110px] rounded-2xl' />
        </div>
      ) : (
        <div className='grid gap-3 grid-cols-2 md:grid-cols-4'>
          <KpiCard
            label='Parcelas do mês'
            value={summary.monthlyPayment}
            tone='warning'
            icon={CalendarClock}
            hint='Soma das parcelas das dívidas em aberto'
          />
          <KpiCard
            label='Total contratado'
            value={summary.total}
            tone='neutral'
            icon={Wallet}
          />
          <KpiCard
            label='Restante a pagar'
            value={summary.remaining}
            tone='danger'
            icon={AlertCircle}
          />
          <KpiCard
            label='Já quitado'
            value={summary.paid}
            tone='success'
            icon={CheckCircle2}
          />
        </div>
      )}

      {/* List */}
      {isInitialLoading ? (
        <div className='grid gap-3 grid-cols-1 lg:grid-cols-2'>
          <Skeleton className='h-[220px] rounded-2xl' />
          <Skeleton className='h-[220px] rounded-2xl' />
        </div>
      ) : debts.length === 0 ? (
        <EmptyState
          onAdd={<AddDebtModal onAddDebt={addDebt} isAdding={isAdding} />}
        />
      ) : (
        <div className='grid gap-3 grid-cols-1 lg:grid-cols-2'>
          {debts.map((debt) => (
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
      )}
    </div>
  );
}
