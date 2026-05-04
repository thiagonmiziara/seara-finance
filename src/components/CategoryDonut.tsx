import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Transaction } from '@/types';
import { CATEGORIES as STATIC_CATEGORIES } from '@/lib/categories';
import { useCategories } from '@/hooks/useCategories';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface CategoryDonutProps {
  transactions: Transaction[];
  topN?: number;
}

export function CategoryDonut({ transactions, topN = 5 }: CategoryDonutProps) {
  const { categories: dyn } = useCategories();

  const { items, total } = useMemo(() => {
    const byCategory = transactions
      .filter((t) => t.type === 'expense')
      .reduce<Record<string, number>>((acc, t) => {
        const key = t.category || 'outros';
        acc[key] = (acc[key] ?? 0) + t.amount;
        return acc;
      }, {});

    const sum = Object.values(byCategory).reduce((s, v) => s + v, 0);
    const list = Object.entries(byCategory)
      .map(([name, value]) => {
        const found =
          dyn.find((c) => c.value === name) ||
          STATIC_CATEGORIES.find((c) => c.value === name);
        return {
          key: name,
          label: found?.label ?? name,
          color: found?.color ?? '#374151',
          value,
          percent: sum > 0 ? (value / sum) * 100 : 0,
        };
      })
      .sort((a, b) => b.value - a.value);

    return { items: list, total: sum };
  }, [transactions, dyn]);

  const top = items.slice(0, topN);
  const rest = items.slice(topN);
  const restValue = rest.reduce((s, i) => s + i.value, 0);
  const restPercent = total > 0 ? (restValue / total) * 100 : 0;

  return (
    <div className='h-full flex flex-col rounded-2xl border border-border/60 bg-card shadow-card p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h3 className='font-bold text-base text-foreground leading-tight'>Por categoria</h3>
          <p className='text-xs text-muted-foreground mt-0.5'>Onde foi seu dinheiro</p>
        </div>
      </div>

      <div className='relative my-3 mx-auto' style={{ width: 200, height: 200 }}>
        {items.length > 0 ? (
          <>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={items}
                  cx='50%'
                  cy='50%'
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey='value'
                  nameKey='label'
                  stroke='none'
                >
                  {items.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
              <span className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                Total
              </span>
              <span className='text-base font-extrabold text-foreground tabular-nums mt-0.5'>
                {formatCurrency(total)}
              </span>
            </div>
          </>
        ) : (
          <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
            Sem despesas no período
          </div>
        )}
      </div>

      {items.length > 0 && (
        <ul className='mt-1 space-y-2'>
          {top.map((it) => (
            <li key={it.key} className='flex items-center gap-2 text-sm'>
              <span
                className='h-2.5 w-2.5 rounded-full shrink-0'
                style={{ backgroundColor: it.color }}
              />
              <span className='flex-1 truncate text-foreground'>{it.label}</span>
              <span className='text-xs font-medium text-muted-foreground tabular-nums w-10 text-right'>
                {it.percent.toFixed(0)}%
              </span>
              <span className='text-sm font-semibold tabular-nums w-20 text-right'>
                {formatCurrency(it.value)}
              </span>
            </li>
          ))}
          {rest.length > 0 && (
            <li className='flex items-center gap-2 text-sm'>
              <span className='h-2.5 w-2.5 rounded-full shrink-0 bg-muted-foreground/40' />
              <span className='flex-1 truncate text-muted-foreground'>
                Outros ({rest.length})
              </span>
              <span className='text-xs font-medium text-muted-foreground tabular-nums w-10 text-right'>
                {restPercent.toFixed(0)}%
              </span>
              <span className='text-sm font-semibold tabular-nums w-20 text-right'>
                {formatCurrency(restValue)}
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
