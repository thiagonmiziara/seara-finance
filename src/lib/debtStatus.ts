import {
  addMonths,
  differenceInCalendarMonths,
  isSameDay,
  parseISO,
  startOfDay,
} from 'date-fns';
import type { Debt } from '@/types';

export type DebtStatus = 'quitada' | 'paga_mes' | 'a_pagar' | 'em_atraso';

export interface DebtStatusInfo {
  status: DebtStatus;
  /** Installment number due in current calendar month (1..N), or null if none. */
  monthInstallmentNumber: number | null;
  /** Due date of next unpaid installment, or null if fully paid / unknown. */
  nextDueDate: Date | null;
  /** True when next unpaid installment due date is today. */
  isDueToday: boolean;
}

function safeParseDebtDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`);
    }
    return parseISO(value);
  } catch {
    return null;
  }
}

export function getDebtStatusInfo(
  debt: Debt,
  reference: Date = new Date(),
): DebtStatusInfo {
  const today = startOfDay(reference);
  const paidInstallments = debt.paidInstallments ?? 0;
  const installments = debt.installments;
  const due = safeParseDebtDate(debt.dueDate);

  if (debt.status === 'pago' || paidInstallments >= installments) {
    return {
      status: 'quitada',
      monthInstallmentNumber: null,
      nextDueDate: null,
      isDueToday: false,
    };
  }

  let monthInstallmentNumber: number | null = null;
  if (due) {
    const monthsSinceFirstDue = differenceInCalendarMonths(today, due);
    const candidate = monthsSinceFirstDue + 1;
    if (candidate >= 1 && candidate <= installments) {
      monthInstallmentNumber = candidate;
    }
  }

  // Next unpaid installment
  const nextInstNumber = paidInstallments + 1;
  const nextDueDate = due ? addMonths(due, nextInstNumber - 1) : null;
  const isDueToday = nextDueDate ? isSameDay(nextDueDate, today) : false;

  // Paid this month: paid count covers the installment that is due in current month
  if (
    monthInstallmentNumber !== null &&
    paidInstallments >= monthInstallmentNumber
  ) {
    return {
      status: 'paga_mes',
      monthInstallmentNumber,
      nextDueDate,
      isDueToday,
    };
  }

  // Overdue: next unpaid installment's due date already passed
  if (nextDueDate && nextDueDate < today) {
    return {
      status: 'em_atraso',
      monthInstallmentNumber,
      nextDueDate,
      isDueToday: false,
    };
  }

  return {
    status: 'a_pagar',
    monthInstallmentNumber,
    nextDueDate,
    isDueToday,
  };
}
