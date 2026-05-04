import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  summary: {
    income: number;
    expense: number;
    balance: number;
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <Card className='hover:border-primary/50 hover:shadow-card transition-all duration-300'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 flex-wrap gap-1'>
          <CardTitle className='text-sm font-medium'>Saldo Atual</CardTitle>
          <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <Wallet className='h-4 w-4 flex-shrink-0' />
          </span>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'text-xl lg:text-2xl font-extrabold tabular-nums break-words',
              summary.balance >= 0 ? 'text-primary' : 'text-red-400',
            )}
          >
            {formatCurrency(summary.balance)}
          </div>
          <p className='text-xs text-muted-foreground mt-1'>
            {summary.balance >= 0 ? '+R$ 0,00' : '-R$ 0,00'} do mês passado
          </p>
        </CardContent>
      </Card>
      <Card className='hover:border-primary/50 hover:shadow-card transition-all duration-300'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 flex-wrap gap-1'>
          <CardTitle className='text-sm font-medium'>Receitas</CardTitle>
          <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <TrendingUp className='h-4 w-4 flex-shrink-0' />
          </span>
        </CardHeader>
        <CardContent>
          <div className='text-xl lg:text-2xl font-extrabold tabular-nums text-primary break-words'>
            {formatCurrency(summary.income)}
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Total de entradas</p>
        </CardContent>
      </Card>
      <Card className='hover:border-primary/50 hover:shadow-card transition-all duration-300'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 flex-wrap gap-1'>
          <CardTitle className='text-sm font-medium'>Despesas</CardTitle>
          <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500'>
            <TrendingDown className='h-4 w-4 flex-shrink-0' />
          </span>
        </CardHeader>
        <CardContent>
          <div className='text-xl lg:text-2xl font-extrabold tabular-nums text-red-400 break-words'>
            {formatCurrency(summary.expense)}
          </div>
          <p className='text-xs text-muted-foreground mt-1'>Total de saídas</p>
        </CardContent>
      </Card>
    </div>
  );
}
