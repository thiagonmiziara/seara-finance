import { useState } from 'react';
import { format, startOfMonth } from 'date-fns';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePeriod, type PeriodType } from './period-context';

const OPTIONS: { id: PeriodType; label: string; shortLabel: string }[] = [
  { id: 'current', label: 'Este mês', shortLabel: 'Este mês' },
  { id: 'previous', label: 'Mês anterior', shortLabel: 'Anterior' },
  { id: 'all', label: 'Tudo', shortLabel: 'Tudo' },
  { id: 'custom', label: 'Personalizado', shortLabel: 'Outro' },
];

export function SegmentedPeriodFilter() {
  const { period, setPeriod, customRange, setCustomRange } = usePeriod();
  const [customOpen, setCustomOpen] = useState(period === 'custom');

  const handleSelect = (id: PeriodType) => {
    setPeriod(id);
    if (id === 'custom') {
      setCustomOpen(true);
    } else {
      setCustomOpen(false);
    }
  };

  const handleCloseCustom = () => {
    setPeriod('current');
    setCustomRange({
      from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    });
    setCustomOpen(false);
  };

  return (
    <div className='relative flex flex-col gap-2 w-full sm:w-auto sm:inline-flex min-w-0'>
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
      </div>

      {customOpen && (
        <div className='sm:absolute sm:top-full sm:right-0 sm:mt-2 sm:z-20 sm:min-w-[300px] flex flex-col gap-3 p-4 rounded-xl border border-border/60 bg-card shadow-card animate-in fade-in slide-in-from-top-1 duration-200'>
          <div className='flex items-center justify-between'>
            <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
              Período personalizado
            </p>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-7 w-7 -mr-2 -mt-1'
              onClick={handleCloseCustom}
              aria-label='Fechar período personalizado'
            >
              <X className='h-3.5 w-3.5' />
            </Button>
          </div>
          <div className='flex items-end gap-2'>
            <div className='space-y-1 flex-1 min-w-0'>
              <label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                Início
              </label>
              <Input
                type='date'
                value={customRange.from}
                onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                className='h-9 w-full'
              />
            </div>
            <div className='space-y-1 flex-1 min-w-0'>
              <label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                Fim
              </label>
              <Input
                type='date'
                value={customRange.to}
                onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                className='h-9 w-full'
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
