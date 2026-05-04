import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Transaction } from '@/types';

interface FlowChartProps {
  transactions: Transaction[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatShort(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

export function FlowChart({ transactions }: FlowChartProps) {
  const data = useMemo(() => {
    const grouped = transactions.reduce<Record<string, { day: string; receita: number; despesa: number; ts: number }>>((acc, t) => {
      if (!t.date) return acc;
      const key = t.date.split('T')[0];
      if (!acc[key]) {
        const d = parseISO(key.length === 10 ? `${key}T00:00:00` : key);
        acc[key] = {
          day: format(d, 'dd/MM'),
          receita: 0,
          despesa: 0,
          ts: d.getTime(),
        };
      }
      if (t.type === 'income') acc[key].receita += t.amount;
      else acc[key].despesa += t.amount;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => a.ts - b.ts);
  }, [transactions]);

  return (
    <div className='h-full flex flex-col rounded-2xl border border-border/60 bg-card shadow-card p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='font-bold text-base text-foreground leading-tight'>Fluxo do mês</h3>
          <p className='text-xs text-muted-foreground mt-0.5'>Receitas vs. despesas por dia</p>
        </div>
        <div className='flex items-center gap-3 text-xs'>
          <span className='inline-flex items-center gap-1.5'>
            <span className='h-2 w-2 rounded-full bg-primary' />
            <span className='text-muted-foreground'>Receitas</span>
          </span>
          <span className='inline-flex items-center gap-1.5'>
            <span className='h-2 w-2 rounded-full bg-red-500' />
            <span className='text-muted-foreground'>Despesas</span>
          </span>
        </div>
      </div>

      <div className='flex-1 mt-3 min-h-[260px]'>
        {data.length > 0 ? (
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id='gradReceita' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='hsl(var(--primary))' stopOpacity={0.35} />
                  <stop offset='100%' stopColor='hsl(var(--primary))' stopOpacity={0} />
                </linearGradient>
                <linearGradient id='gradDespesa' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='hsl(0 72% 55%)' stopOpacity={0.35} />
                  <stop offset='100%' stopColor='hsl(0 72% 55%)' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray='3 4'
                stroke='hsl(var(--chart-grid))'
                vertical={false}
              />
              <XAxis
                dataKey='day'
                stroke='hsl(var(--muted-foreground))'
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval='preserveStartEnd'
                minTickGap={20}
              />
              <YAxis
                stroke='hsl(var(--muted-foreground))'
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `R$${formatShort(v)}`}
                width={50}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--chart-tooltip-bg))',
                  border: '1px solid hsl(var(--chart-tooltip-border))',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
                labelStyle={{ color: 'hsl(var(--chart-tooltip-text))', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: 'hsl(var(--chart-tooltip-text))' }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
              />
              <Area
                type='monotone'
                dataKey='receita'
                name='Receitas'
                stroke='hsl(var(--primary))'
                strokeWidth={2.5}
                fill='url(#gradReceita)'
              />
              <Area
                type='monotone'
                dataKey='despesa'
                name='Despesas'
                stroke='hsl(0 72% 55%)'
                strokeWidth={2.5}
                fill='url(#gradDespesa)'
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
            Sem movimentações no período
          </div>
        )}
      </div>
    </div>
  );
}
