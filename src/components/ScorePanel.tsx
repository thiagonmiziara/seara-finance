import { TrendingUp } from 'lucide-react';
import { useHealthScore } from '@/hooks/useHealthScore';
import { ScoreGauge } from './ScoreGauge';
import { cn } from '@/lib/utils';

function statusFromScore(value: number): {
  label: string;
  pillClass: string;
  arrow: '↗' | '→' | '↘';
} {
  if (value >= 70) {
    return {
      label: 'Bom',
      pillClass: 'bg-primary/15 text-primary',
      arrow: '↗',
    };
  }
  if (value >= 40) {
    return {
      label: 'Atenção',
      pillClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      arrow: '→',
    };
  }
  return {
    label: 'Crítico',
    pillClass: 'bg-red-500/15 text-red-600 dark:text-red-400',
    arrow: '↘',
  };
}

export function ScorePanel() {
  const { score, loading } = useHealthScore();
  const total = score?.total ?? 0;
  const status = statusFromScore(total);
  const breakdown = score?.breakdown;

  return (
    <div className='h-full flex flex-col rounded-2xl border border-border/60 bg-card shadow-card p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='font-bold text-base text-foreground leading-tight'>
            Saúde Financeira
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>Pontuação geral</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
            status.pillClass,
          )}
        >
          <TrendingUp className='h-3 w-3' />
          {status.label}
        </span>
      </div>

      <div className='flex-1 flex items-center justify-center my-3'>
        <ScoreGauge value={total} loading={loading || !score} size={180} />
      </div>

      <div className='grid grid-cols-2 gap-2'>
        <div className='rounded-lg bg-muted/60 px-3 py-2'>
          <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
            Limite
          </div>
          <div className='text-sm font-extrabold text-foreground tabular-nums mt-0.5'>
            +{breakdown?.limitUsage ?? 0}
          </div>
        </div>
        <div className='rounded-lg bg-muted/60 px-3 py-2'>
          <div className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
            Pontualidade
          </div>
          <div className='text-sm font-extrabold text-foreground tabular-nums mt-0.5'>
            +{breakdown?.punctuality ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}
