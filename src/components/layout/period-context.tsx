import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from '@/hooks/useFinance';

export type PeriodType = 'current' | 'previous' | 'custom' | 'all';

export interface CustomRange {
  from: string;
  to: string;
}

interface PeriodContextValue {
  period: PeriodType;
  setPeriod: (p: PeriodType) => void;
  customRange: CustomRange;
  setCustomRange: (range: CustomRange) => void;
  /**
   * Active date range. `undefined` for `all` so `useFinance` returns
   * every transaction without filtering.
   */
  dateRange: DateRange | undefined;
  selectedMonthLabel: string;
}

const PeriodContext = createContext<PeriodContextValue | undefined>(undefined);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<PeriodType>('current');
  const [customRange, setCustomRange] = useState<CustomRange>({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  const dateRange = useMemo<DateRange | undefined>(() => {
    const now = new Date();
    if (period === 'current') {
      return { from: startOfMonth(now), to: endOfDay(now) };
    }
    if (period === 'previous') {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    if (period === 'custom') {
      return {
        from: startOfDay(new Date(customRange.from + 'T00:00:00')),
        to: endOfDay(new Date(customRange.to + 'T23:59:59')),
      };
    }
    return undefined; // 'all'
  }, [period, customRange]);

  const selectedMonthLabel = useMemo(() => {
    const now = new Date();
    const formatMonth = (date: Date) => {
      const label = format(date, 'MMMM', { locale: ptBR });
      return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
    };
    if (period === 'current') return formatMonth(now);
    if (period === 'previous') return formatMonth(subMonths(now, 1));
    if (period === 'custom') return formatMonth(new Date(`${customRange.from}T00:00:00`));
    return 'Todo o histórico';
  }, [period, customRange.from]);

  const value = useMemo(
    () => ({ period, setPeriod, customRange, setCustomRange, dateRange, selectedMonthLabel }),
    [period, customRange, dateRange, selectedMonthLabel],
  );

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriod must be used within PeriodProvider');
  return ctx;
}
