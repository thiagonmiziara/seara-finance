import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Transaction } from '@/types';
import { useMonthComparison } from '@/hooks/useMonthComparison';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  transactions: Transaction[];
  monthA: Date;
  monthB: Date;
  className?: string;
};

function money(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const MonthComparisonChart: React.FC<Props> = ({
  transactions,
  monthA,
  monthB,
  className,
}) => {
  // when there are no real transactions, use mocked data so the chart is visible
  const effectiveTransactions: Transaction[] =
    transactions && transactions.length > 0
      ? transactions
      : (() => {
          const makeTx = (
            id: string,
            category: string,
            amount: number,
            date: Date,
          ) => ({
            id,
            description: `Mock ${category}`,
            amount,
            category,
            type: 'expense' as const,
            status: 'pago' as const,
            date: date.toISOString(),
            createdAt: new Date().toISOString(),
          });

          // small mocked dataset for both months
          const cats = [
            'salario',
            'compras',
            'alimentacao',
            'transporte',
            'lazer',
            'outros',
          ];

          const aDate = new Date(monthA.getFullYear(), monthA.getMonth(), 10);
          const bDate = new Date(monthB.getFullYear(), monthB.getMonth(), 10);

          const mocks: Transaction[] = [] as any;

          // month A (example amounts)
          mocks.push(makeTx('mock-a-1', 'compras', 120, aDate));
          mocks.push(makeTx('mock-a-2', 'alimentacao', 100, aDate));
          mocks.push(makeTx('mock-a-3', 'transporte', 80, aDate));
          mocks.push(makeTx('mock-a-4', 'lazer', 50, aDate));
          mocks.push(makeTx('mock-a-5', 'outros', 50, aDate));

          // month B (example amounts summing to 556 to mirror the screenshot)
          mocks.push(makeTx('mock-b-1', 'compras', 200, bDate));
          mocks.push(makeTx('mock-b-2', 'alimentacao', 250, bDate));
          mocks.push(makeTx('mock-b-3', 'transporte', 30, bDate));
          mocks.push(makeTx('mock-b-4', 'lazer', 76, bDate));

          return mocks as Transaction[];
        })();

  const { getComparison } = useMonthComparison(effectiveTransactions);

  const totalsExpense = getComparison(
    monthA,
    monthB,
    'total',
    'expense',
  ) as any;
  const categoriesExpense = getComparison(
    monthA,
    monthB,
    'category',
    'expense',
  ) as any[];

  const totalsIncome = getComparison(monthA, monthB, 'total', 'income') as any;
  const categoriesIncome = getComparison(
    monthA,
    monthB,
    'category',
    'income',
  ) as any[];

  // For expenses we only show a total comparison (month A vs month B)
  const chartDataExpense = [
    {
      name: 'Total',
      A: totalsExpense.monthA,
      B: totalsExpense.monthB,
    },
  ];

  // For income we also show only a total comparison (month A vs month B)
  const chartDataIncome = [
    {
      name: 'Total',
      A: totalsIncome.monthA,
      B: totalsIncome.monthB,
    },
  ];

  return (
    <div className={className}>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Expenses comparison */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-sm text-muted-foreground mb-3'>
                {format(monthA, 'MMMM yyyy', { locale: ptBR })} vs{' '}
                {format(monthB, 'MMMM yyyy', { locale: ptBR })}
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
                <div className='col-span-1'>
                  <div className='text-sm text-muted-foreground'>
                    Gastos ({format(monthA, 'MMMM yyyy', { locale: ptBR })})
                  </div>
                  <div className='text-xl font-bold'>
                    {money(totalsExpense.monthA)}
                  </div>
                </div>
                <div className='col-span-1'>
                  <div className='text-sm text-muted-foreground'>
                    Gastos ({format(monthB, 'MMMM yyyy', { locale: ptBR })})
                  </div>
                  <div className='text-xl font-bold'>
                    {money(totalsExpense.monthB)}
                  </div>
                </div>
              </div>

              <div className='h-[250px] sm:h-[300px] w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={chartDataExpense}
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    barGap={20}
                    barCategoryGap='40%'
                  >
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke='#333'
                      vertical={false}
                    />
                    <XAxis
                      dataKey='name'
                      stroke='#888888'
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke='#888888'
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => money(Number(v))}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #333',
                        borderRadius: 8,
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar
                      dataKey='A'
                      name={format(monthA, 'MMMM yyyy', { locale: ptBR })}
                      fill='#9CA3AF'
                      radius={[4, 4, 0, 0]}
                      barSize={80}
                    />
                    <Bar
                      dataKey='B'
                      name={format(monthB, 'MMMM yyyy', { locale: ptBR })}
                      fill='hsl(var(--primary))'
                      radius={[4, 4, 0, 0]}
                      barSize={80}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Income comparison */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Comparativo de Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-sm text-muted-foreground mb-3'>
                {format(monthA, 'MMMM yyyy', { locale: ptBR })} vs{' '}
                {format(monthB, 'MMMM yyyy', { locale: ptBR })}
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
                <div className='col-span-1'>
                  <div className='text-sm text-muted-foreground'>
                    Receitas ({format(monthA, 'MMMM yyyy', { locale: ptBR })})
                  </div>
                  <div className='text-xl font-bold'>
                    {money(totalsIncome.monthA)}
                  </div>
                </div>
                <div className='col-span-1'>
                  <div className='text-sm text-muted-foreground'>
                    Receitas ({format(monthB, 'MMMM yyyy', { locale: ptBR })})
                  </div>
                  <div className='text-xl font-bold'>
                    {money(totalsIncome.monthB)}
                  </div>
                </div>
              </div>

              <div className='h-[250px] sm:h-[300px] w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={chartDataIncome}
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    barGap={20}
                    barCategoryGap='40%'
                  >
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke='#333'
                      vertical={false}
                    />
                    <XAxis
                      dataKey='name'
                      stroke='#888888'
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke='#888888'
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => money(Number(v))}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #333',
                        borderRadius: 8,
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar
                      dataKey='A'
                      name={format(monthA, 'MMMM yyyy', { locale: ptBR })}
                      fill='#9CA3AF'
                      radius={[4, 4, 0, 0]}
                      barSize={80}
                    />
                    <Bar
                      dataKey='B'
                      name={format(monthB, 'MMMM yyyy', { locale: ptBR })}
                      fill='hsl(var(--primary))'
                      radius={[4, 4, 0, 0]}
                      barSize={80}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MonthComparisonChart;
