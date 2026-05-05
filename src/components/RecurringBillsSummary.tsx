import { useMemo } from 'react';
import { format } from 'date-fns';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { useFinance } from '@/hooks/useFinance';
import {
  NewRecurringBillButton,
  EditRecurringBillButton,
} from '@/components/AddRecurringBillModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RecurringBill, RecurringBillFormValues, Transaction } from '@/types';
import { CATEGORIES as STATIC_CATEGORIES } from '@/lib/categories';
import { useCategories } from '@/hooks/useCategories';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  RotateCcw,
  Trash2,
  Repeat,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function fmtBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface BillCardProps {
  bill: RecurringBill;
  categoryLabel: string;
  categoryColor: string;
  monthTx?: Transaction;
  monthLabel: string;
  onEdit: (data: RecurringBillFormValues) => Promise<any>;
  onToggle: () => Promise<any> | void;
  onRemove: () => Promise<any> | void;
  onTogglePaid?: (tx: Transaction) => Promise<any> | void;
  isUpdating?: boolean;
  isDeleting?: boolean;
  isUpdatingPaid?: boolean;
}

function BillCard({
  bill,
  categoryLabel,
  categoryColor,
  monthTx,
  monthLabel,
  onEdit,
  onToggle,
  onRemove,
  onTogglePaid,
  isUpdating,
  isDeleting,
  isUpdatingPaid,
}: BillCardProps) {
  const isIncome = bill.type === 'income';
  const Icon = isIncome ? ArrowUpRight : ArrowDownLeft;
  const isPaidThisMonth =
    !!monthTx && (monthTx.status === 'pago' || monthTx.status === 'recebido');

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card shadow-card p-4 sm:p-5 transition-all',
        bill.isActive ? 'hover:border-primary/40' : 'opacity-60',
      )}
    >
      {/* Top row: icon + title + status pill */}
      <div className='flex items-start gap-3'>
        <span
          className='inline-flex h-10 w-10 items-center justify-center rounded-xl shrink-0'
          style={{ backgroundColor: `${categoryColor}38`, color: categoryColor }}
        >
          <Icon className='h-5 w-5' />
        </span>

        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h3 className='font-semibold text-foreground truncate'>
              {bill.description}
            </h3>
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
                bill.isActive
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {bill.isActive ? 'Ativa' : 'Pausada'}
            </span>
          </div>
          <p className='text-xs text-muted-foreground mt-0.5 truncate'>
            {categoryLabel} · vence dia {bill.dueDay}
          </p>
        </div>

        <EditRecurringBillButton
          bill={bill}
          onSave={onEdit}
          isSaving={isUpdating}
        />
      </div>

      {/* Amount */}
      <div className='mt-4 flex items-end gap-1'>
        <span
          className={cn(
            'text-xl sm:text-2xl font-extrabold tabular-nums leading-none',
            isIncome ? 'text-primary' : 'text-foreground',
          )}
        >
          {isIncome ? '+ ' : '- '}
          {fmtBRL(bill.amount)}
        </span>
        <span className='text-[11px] text-muted-foreground font-medium pb-0.5'>
          /mês
        </span>
      </div>

      {/* Monthly payment status */}
      {bill.isActive && monthTx && onTogglePaid && (
        <div className='mt-3 flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2'>
          <div className='min-w-0'>
            <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
              {monthLabel}
            </div>
            <span
              className={cn(
                'mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
                isPaidThisMonth
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
              )}
            >
              {isPaidThisMonth
                ? isIncome
                  ? 'Recebido'
                  : 'Pago'
                : isIncome
                  ? 'A receber'
                  : 'Pendente'}
            </span>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={isUpdatingPaid}
            onClick={() => onTogglePaid(monthTx)}
            className={cn(
              'h-8 px-2 shrink-0',
              isPaidThisMonth
                ? 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'
                : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10',
            )}
            aria-label={
              isPaidThisMonth ? 'Desfazer pagamento' : 'Marcar como pago'
            }
          >
            {isPaidThisMonth ? (
              <>
                <RotateCcw className='mr-1 h-3.5 w-3.5' />
                Desfazer
              </>
            ) : (
              <>
                <Check className='mr-1 h-3.5 w-3.5' />
                {isIncome ? 'Recebi' : 'Paguei'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Footer: toggle + status + delete */}
      <div className='mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2'>
        <button
          type='button'
          role='switch'
          aria-checked={bill.isActive}
          aria-label={bill.isActive ? 'Pausar conta fixa' : 'Ativar conta fixa'}
          onClick={() => onToggle()}
          disabled={isUpdating}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
            bill.isActive ? 'bg-primary' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'inline-block h-5 w-5 transform rounded-full bg-white shadow-soft transition-transform',
              bill.isActive ? 'translate-x-[22px]' : 'translate-x-0.5',
            )}
          />
        </button>

        <span className='hidden sm:inline text-xs text-muted-foreground flex-1 truncate'>
          {bill.isActive
            ? 'Lança automaticamente'
            : 'Pausada — nada será lançado'}
        </span>

        <ConfirmDialog
          trigger={
            <button
              type='button'
              className='inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0'
              aria-label={`Excluir conta fixa ${bill.description}`}
            >
              <Trash2 className='h-4 w-4' />
            </button>
          }
          title='Excluir conta fixa?'
          description={`"${bill.description}" será removida. Transações já lançadas não são apagadas.`}
          onConfirm={() => onRemove()}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: React.ReactNode }) {
  return (
    <div className='rounded-2xl border border-dashed border-border/60 bg-card/50 p-10 text-center'>
      <div className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4'>
        <Repeat className='h-6 w-6' />
      </div>
      <h3 className='font-bold text-base'>Nenhuma conta fixa</h3>
      <p className='text-sm text-muted-foreground mt-1 max-w-sm mx-auto'>
        Cadastre receitas e despesas que se repetem mensalmente — elas serão
        lançadas automaticamente todo mês.
      </p>
      <div className='mt-4 inline-block'>{onAdd}</div>
    </div>
  );
}

export function RecurringBillsSummary() {
  // Auto-sync runs at the AppShell level so it executes only once globally.
  const {
    recurringBills,
    addBill,
    updateBill,
    removeBill,
    toggleActive,
    isAdding,
    isUpdating,
    isDeleting,
    isLoading,
  } = useRecurringBills();
  const {
    allTransactions,
    updateTransactionStatus,
    isUpdatingStatus,
  } = useFinance();
  const { categories: dyn } = useCategories();
  const allCats = dyn.length > 0 ? dyn : STATIC_CATEGORIES;

  const yearMonth = format(new Date(), 'yyyy-MM');
  const monthLabel = `Mês ${format(new Date(), 'MM/yyyy')}`;

  const monthTxByBillId = useMemo(() => {
    const map = new Map<string, Transaction>();
    for (const t of allTransactions) {
      if (
        !t.isProjected &&
        t.recurringBillId &&
        t.recurringYearMonth === yearMonth
      ) {
        map.set(t.recurringBillId, t);
      }
    }
    return map;
  }, [allTransactions, yearMonth]);

  const handleTogglePaid = (tx: Transaction) => {
    const isSettled = tx.status === 'pago' || tx.status === 'recebido';
    const next: Transaction['status'] = isSettled
      ? tx.type === 'income'
        ? 'a_receber'
        : 'a_pagar'
      : tx.type === 'income'
        ? 'recebido'
        : 'pago';
    return updateTransactionStatus({ id: tx.id, status: next });
  };

  const activeCount = recurringBills.filter((b) => b.isActive).length;
  const totalNet = recurringBills
    .filter((b) => b.isActive)
    .reduce(
      (sum, b) => sum + (b.type === 'expense' ? -b.amount : b.amount),
      0,
    );
  const isPositive = totalNet >= 0;

  const handleEdit =
    (bill: RecurringBill) => (data: RecurringBillFormValues) =>
      updateBill({ id: bill.id, data });

  return (
    <div className='space-y-6 anim-fade-up'>
      {/* Header */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between flex-wrap'>
        <div className='min-w-0'>
          <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight font-display'>
            Contas fixas
          </h2>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Recorrências mensais que entram automáticas no seu fluxo.
          </p>
        </div>
        <NewRecurringBillButton onSave={addBill} isSaving={isAdding} />
      </div>

      {/* Hero highlight card */}
      <section
        className='relative overflow-hidden rounded-2xl border border-border/60 shadow-card p-5 sm:p-6 brand-gradient'
      >
        <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
          <div className='min-w-0'>
            <div className='text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-muted-foreground'>
              {isPositive
                ? 'Entrada líquida fixa por mês'
                : 'Saída líquida fixa por mês'}
            </div>
            <div
              className={cn(
                'mt-1 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight',
                isPositive ? 'text-primary' : 'text-foreground',
              )}
            >
              {isPositive ? '+ ' : '- '}
              {fmtBRL(Math.abs(totalNet))}
            </div>
            <p className='mt-1 text-xs text-muted-foreground'>
              {activeCount} {activeCount === 1 ? 'conta ativa' : 'contas ativas'} ·{' '}
              {recurringBills.length}{' '}
              {recurringBills.length === 1 ? 'cadastrada' : 'cadastradas'}
            </p>
          </div>

          <div className='inline-flex items-center gap-1.5 self-start sm:self-end rounded-full bg-card/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-muted-foreground border border-border/60'>
            <CalendarClock className='h-3.5 w-3.5 text-primary' />
            Lançadas automaticamente
          </div>
        </div>
      </section>

      {/* List */}
      {isLoading ? (
        <div className='grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
          <Skeleton className='h-[180px] rounded-2xl' />
          <Skeleton className='h-[180px] rounded-2xl' />
          <Skeleton className='h-[180px] rounded-2xl' />
        </div>
      ) : recurringBills.length === 0 ? (
        <EmptyState
          onAdd={
            <NewRecurringBillButton onSave={addBill} isSaving={isAdding} />
          }
        />
      ) : (
        <div className='grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
          {recurringBills.map((bill) => {
            const cat = allCats.find((c) => c.value === bill.category);
            return (
              <BillCard
                key={bill.id}
                bill={bill}
                categoryLabel={cat?.label ?? bill.category}
                categoryColor={cat?.color ?? '#64748b'}
                monthTx={monthTxByBillId.get(bill.id)}
                monthLabel={monthLabel}
                onEdit={handleEdit(bill)}
                onToggle={() => toggleActive(bill)}
                onRemove={() => removeBill(bill.id)}
                onTogglePaid={handleTogglePaid}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
                isUpdatingPaid={isUpdatingStatus}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
