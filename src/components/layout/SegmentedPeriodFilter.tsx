import { useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import { CalendarDays, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePeriod, type PeriodType } from './period-context';

const OPTIONS: { id: PeriodType; label: string; shortLabel: string }[] = [
  { id: 'current', label: 'Este mês', shortLabel: 'Este mês' },
  { id: 'previous', label: 'Mês anterior', shortLabel: 'Anterior' },
  { id: 'all', label: 'Tudo', shortLabel: 'Tudo' },
];

export function SegmentedPeriodFilter() {
  const { period, setPeriod, customRange, setCustomRange } = usePeriod();
  const [customOpen, setCustomOpen] = useState(period === 'custom');

  const handleSelect = (id: PeriodType) => {
    setPeriod(id);
    if (id !== 'custom') setCustomOpen(false);
  };

  return (
    <div className='flex flex-col gap-2 w-full sm:w-auto sm:inline-flex min-w-0'>
      <div className='flex items-center gap-1 rounded-full border border-border/60 bg-card p-1 shadow-soft overflow-x-auto scrollbar-hide max-w-full'>
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type='button'
            onClick={() => handleSelect(opt.id)}
            className={cn(
              'shrink-0 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all whitespace-nowrap',
              period === opt.id
                ? 'bg-primary text-primary-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={period === opt.id}
            title={opt.label}
          >
            <span className='sm:hidden'>{opt.shortLabel}</span>
            <span className='hidden sm:inline'>{opt.label}</span>
          </button>
        ))}
        <button
          type='button'
          onClick={() => {
            const next = !customOpen;
            setCustomOpen(next);
            if (next) setPeriod('custom');
          }}
          className={cn(
            'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all',
            period === 'custom'
              ? 'bg-primary text-primary-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={period === 'custom'}
          title='Personalizado'
          aria-label='Período personalizado'
        >
          <CalendarDays className='h-3.5 w-3.5' />
          <span className='hidden sm:inline'>Personalizado</span>
        </button>
      </div>

      {customOpen && (
        <div className='flex flex-wrap items-end gap-2 p-3 rounded-xl border border-border/60 bg-card shadow-soft animate-in fade-in slide-in-from-top-1 duration-200'>
          <div className='space-y-1'>
            <label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
              Início
            </label>
            <Input
              type='date'
              value={customRange.from}
              onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
              className='h-9 w-auto'
            />
          </div>
          <div className='space-y-1'>
            <label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
              Fim
            </label>
            <Input
              type='date'
              value={customRange.to}
              onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
              className='h-9 w-auto'
            />
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-9 w-9'
            onClick={() => {
              setPeriod('current');
              setCustomRange({
                from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                to: format(new Date(), 'yyyy-MM-dd'),
              });
              setCustomOpen(false);
            }}
            aria-label='Fechar período personalizado'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
