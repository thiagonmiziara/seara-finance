import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  value: number; // 0–100
  loading?: boolean;
  size?: number;
  className?: string;
}

function pickColor(value: number) {
  if (value < 40) return 'hsl(0, 72%, 55%)';
  if (value < 70) return 'hsl(38, 92%, 50%)';
  return 'hsl(152, 65%, 42%)';
}

export function ScoreGauge({
  value,
  loading,
  size = 180,
  className,
}: ScoreGaugeProps) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (loading) {
      setAnimated(0);
      return;
    }
    const t = setTimeout(() => setAnimated(value), 100);
    return () => clearTimeout(t);
  }, [value, loading]);

  const safeValue = Math.max(0, Math.min(100, animated));
  const color = pickColor(value);

  const data = [
    { key: 'score', value: Math.max(0.0001, safeValue), color },
    { key: 'rest', value: Math.max(0.0001, 100 - safeValue), color: 'hsl(var(--muted))' },
  ];

  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            data={data}
            cx='50%'
            cy='50%'
            innerRadius={size * 0.36}
            outerRadius={size * 0.48}
            paddingAngle={2}
            dataKey='value'
            startAngle={90}
            endAngle={-270}
            stroke='none'
            isAnimationActive
            animationDuration={900}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
        <span
          className='text-4xl font-extrabold tabular-nums leading-none'
          style={{ color }}
        >
          {loading ? '—' : Math.round(animated)}
        </span>
        <span className='mt-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
          de 100
        </span>
      </div>
    </div>
  );
}
