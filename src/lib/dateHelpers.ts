import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function getMonthRange(date: Date) {
  return { from: startOfMonth(date), to: endOfMonth(date) };
}

export function prevMonth(date: Date) {
  return subMonths(date, 1);
}

export function formatMonthLabel(date: Date) {
  const label = format(date, 'MMMM yyyy', { locale: ptBR });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}
