import { useEffect, useMemo, useState } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, CalendarClock, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useDebts } from '@/hooks/useDebts';
import { getDebtStatusInfo } from '@/lib/debtStatus';
import { cn } from '@/lib/utils';
import type { Debt } from '@/types';

function fmtBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface ReminderItem {
  debt: Debt;
  kind: 'today' | 'overdue';
  dueDate: Date;
  daysLate: number;
}

// Mounts once per login (no sessionStorage — that would block re-display
// after logout/login on the same tab). Pops up when the user has any
// installment overdue or due today.
export function DueDebtsReminderModal() {
  const { user } = useAuth();
  const { debts, isInitialLoading, incrementInstallment, isUpdating } =
    useDebts();
  const [isOpen, setIsOpen] = useState(false);
  const [shownInSession, setShownInSession] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const items = useMemo<ReminderItem[]>(() => {
    if (!debts || debts.length === 0) return [];
    const today = startOfDay(new Date());
    const out: ReminderItem[] = [];
    for (const debt of debts) {
      const info = getDebtStatusInfo(debt, today);
      if (!info.nextDueDate) continue;
      if (info.status === 'em_atraso') {
        const daysLate = Math.max(
          1,
          Math.round(
            (today.getTime() - startOfDay(info.nextDueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        out.push({
          debt,
          kind: 'overdue',
          dueDate: info.nextDueDate,
          daysLate,
        });
      } else if (
        info.status === 'a_pagar' &&
        isSameDay(info.nextDueDate, today)
      ) {
        out.push({
          debt,
          kind: 'today',
          dueDate: info.nextDueDate,
          daysLate: 0,
        });
      }
    }
    out.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'overdue' ? -1 : 1;
      return b.daysLate - a.daysLate;
    });
    return out;
  }, [debts]);

  useEffect(() => {
    if (!user || isInitialLoading || shownInSession) return;
    if (items.length > 0) {
      setIsOpen(true);
      setShownInSession(true);
    }
  }, [user, isInitialLoading, items, shownInSession]);

  const overdueCount = items.filter((i) => i.kind === 'overdue').length;
  const todayCount = items.filter((i) => i.kind === 'today').length;

  const handlePay = async (item: ReminderItem) => {
    setPayingId(item.debt.id);
    try {
      await incrementInstallment(item.debt);
    } finally {
      setPayingId(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='sm:max-w-[480px] p-4 sm:p-5 gap-3'>
        <DialogHeader className='space-y-1'>
          <DialogTitle className='flex items-center gap-2 text-base'>
            <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0'>
              <CalendarClock className='h-4 w-4' />
            </span>
            Lembrete de dívidas
          </DialogTitle>
          <DialogDescription className='text-xs'>
            {overdueCount > 0 && todayCount > 0
              ? `${overdueCount} em atraso · ${todayCount} ${todayCount === 1 ? 'vence hoje' : 'vencem hoje'}`
              : overdueCount > 0
                ? `${overdueCount} ${overdueCount === 1 ? 'dívida em atraso' : 'dívidas em atraso'}`
                : `${todayCount} ${todayCount === 1 ? 'dívida vence hoje' : 'dívidas vencem hoje'}`}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-1.5'>
          {items.map((item) => {
            const isOverdue = item.kind === 'overdue';
            const inst = (item.debt.paidInstallments ?? 0) + 1;
            return (
              <div
                key={item.debt.id}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5',
                  isOverdue
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-amber-500/30 bg-amber-500/5',
                )}
              >
                <div className='flex items-center gap-2 min-w-0 flex-1'>
                  <span
                    className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-md shrink-0',
                      isOverdue
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {isOverdue ? (
                      <AlertTriangle className='h-3.5 w-3.5' />
                    ) : (
                      <CalendarClock className='h-3.5 w-3.5' />
                    )}
                  </span>
                  <div className='min-w-0 flex-1'>
                    <h4 className='text-xs sm:text-sm font-semibold capitalize truncate leading-tight'>
                      {item.debt.description}
                    </h4>
                    <p className='text-[10px] text-muted-foreground truncate leading-tight mt-0.5'>
                      {inst}/{item.debt.installments} ·{' '}
                      {fmtBRL(item.debt.installmentAmount)} ·{' '}
                      {isOverdue
                        ? `${item.daysLate}d atraso`
                        : `hoje (${format(item.dueDate, 'dd/MM', { locale: ptBR })})`}
                    </p>
                  </div>
                </div>
                <Button
                  type='button'
                  size='sm'
                  variant='secondary'
                  className='shrink-0 h-7 px-2 text-xs bg-primary/10 hover:bg-primary/15 text-primary border-0'
                  disabled={isUpdating && payingId === item.debt.id}
                  onClick={() => handlePay(item)}
                >
                  <Check className='mr-1 h-3 w-3' />
                  Paguei
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
