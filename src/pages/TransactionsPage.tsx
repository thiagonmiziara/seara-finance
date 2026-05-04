import { useMemo, useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Download } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { useProjectedTransactions } from '@/hooks/useProjectedTransactions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionChart } from '@/components/TransactionChart';
import { CategoryChart } from '@/components/CategoryChart';
import MonthComparisonChart from '@/components/MonthComparisonChart';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { ImportCSVModal } from '@/components/ImportCSVModal';
import { SegmentedPeriodFilter } from '@/components/layout/SegmentedPeriodFilter';
import { usePeriod } from '@/components/layout/period-context';
import { Transaction } from '@/types';

export default function TransactionsPage() {
  const { dateRange, selectedMonthLabel } = usePeriod();
  const {
    transactions: realTransactions,
    dashboardTransactions: realDashboard,
    allTransactions,
    addTransaction,
    addTransactionsBatch,
    addTransfer,
    removeTransaction,
    exportToCSV: rawExportToCSV,
    isAdding,
    isDeleting,
    isInitialLoading,
  } = useFinance(dateRange);
  const projected = useProjectedTransactions(
    dateRange ?? {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
    allTransactions,
  );

  const dashboardTransactions = useMemo<Transaction[]>(
    () => [...realDashboard, ...projected].sort((a, b) => b.date.localeCompare(a.date)),
    [realDashboard, projected],
  );

  const transactions = useMemo<Transaction[]>(
    () => [...realTransactions, ...projected].sort((a, b) => b.date.localeCompare(a.date)),
    [realTransactions, projected],
  );

  const exportToCSV = () => rawExportToCSV(dashboardTransactions);

  const [monthA, setMonthA] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'));
  const [monthB, setMonthB] = useState(format(new Date(), 'yyyy-MM'));

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <h1 className='text-3xl font-extrabold tracking-tight font-display'>
            Transações
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Lista completa do período: {selectedMonthLabel}.
          </p>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-end gap-3'>
          <SegmentedPeriodFilter />
        </div>
      </div>

      <div className='flex flex-col sm:flex-row gap-2 flex-wrap'>
        <AddTransactionModal
          onAddTransaction={addTransaction}
          onAddTransfer={addTransfer}
          isAdding={isAdding}
          className='w-full sm:w-auto'
        />
        <ImportCSVModal
          onAddTransactionsBatch={addTransactionsBatch}
          className='w-full sm:w-auto'
        />
        <Button
          variant='outline'
          className='w-full sm:w-auto bg-background/50 border-border/50'
          onClick={exportToCSV}
        >
          <Download className='mr-2 h-4 w-4' />
          Exportar CSV
        </Button>
      </div>

      <section className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        {isInitialLoading ? (
          <>
            <Skeleton className='lg:col-span-4 h-[350px]' />
            <Skeleton className='lg:col-span-3 h-[350px]' />
          </>
        ) : (
          <>
            <TransactionChart transactions={dashboardTransactions} />
            <CategoryChart transactions={dashboardTransactions} />
          </>
        )}
      </section>

      <section className='bg-card p-4 rounded-xl border border-border/60 shadow-soft'>
        <div className='flex items-center gap-3 mb-4 flex-col sm:flex-row'>
          <div className='flex items-center gap-2'>
            <label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
              Mês A
            </label>
            <Input
              type='month'
              value={monthA}
              onChange={(e) => setMonthA(e.target.value)}
              className='h-10'
            />
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
              Mês B
            </label>
            <Input
              type='month'
              value={monthB}
              onChange={(e) => setMonthB(e.target.value)}
              className='h-10'
            />
          </div>
        </div>
        <MonthComparisonChart
          transactions={allTransactions}
          monthA={new Date(monthA + '-01T00:00:00')}
          monthB={new Date(monthB + '-01T00:00:00')}
        />
      </section>

      <section className='space-y-4'>
        <h2 className='text-xl font-bold tracking-tight'>Lista de transações</h2>
        {isInitialLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-[50px] w-full' />
            <Skeleton className='h-[200px] w-full' />
          </div>
        ) : (
          <TransactionTable
            data={transactions}
            onDelete={removeTransaction}
            isDeleting={isDeleting}
          />
        )}
      </section>
    </div>
  );
}
