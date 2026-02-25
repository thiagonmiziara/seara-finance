import { useDebts } from '@/hooks/useDebts';
import { AddDebtModal } from '@/components/AddDebtModal';
import { DebtsTable } from '@/components/DebtsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { DebtStatusChart } from '@/components/DebtStatusChart';
import { DebtProgressChart } from '@/components/DebtProgressChart';

export default function DebtsView() {
    const {
        debts,
        addDebt,
        removeDebt,
        incrementInstallment,
        settleDebt,
        summary,
        isAdding,
        isDeleting,
        isInitialLoading,
    } = useDebts();

    return (
        <div className='space-y-8 animate-in fade-in duration-500'>
            <div className='flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 bg-card p-4 rounded-xl border border-border/50 shadow-sm'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>Dívidas</h2>
                    <p className='text-muted-foreground'>
                        Controle seus parcelamentos, financiamentos e débitos.
                    </p>
                </div>
                <AddDebtModal onAddDebt={addDebt} isAdding={isAdding} />
            </div>

            {/* Summaries */}
            {isInitialLoading ? (
                <div className='grid gap-4 md:grid-cols-3'>
                    <Skeleton className='h-[120px]' />
                    <Skeleton className='h-[120px]' />
                    <Skeleton className='h-[120px]' />
                </div>
            ) : (
                <div className='grid gap-4 md:grid-cols-3'>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>Total em Dívidas</CardTitle>
                            <Wallet className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(summary.total)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>Valor Restante a Pagar</CardTitle>
                            <AlertCircle className='h-4 w-4 text-red-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold text-red-500'>
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(summary.remaining)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>Dívidas Quitadas</CardTitle>
                            <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold text-emerald-500'>
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(summary.paid)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts */}
            {!isInitialLoading && debts.length > 0 && (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-8'>
                    <DebtProgressChart debts={debts} />
                    <DebtStatusChart summary={summary} />
                </div>
            )}

            {/* Table */}
            <div className='space-y-4'>
                <h3 className='text-xl font-semibold tracking-tight'>Minhas Dívidas</h3>
                {isInitialLoading ? (
                    <div className='space-y-2'>
                        <Skeleton className='h-[50px] w-full' />
                        <Skeleton className='h-[200px] w-full' />
                    </div>
                ) : (
                    <DebtsTable
                        debts={debts}
                        onDelete={removeDebt}
                        onIncrementInstallment={incrementInstallment}
                        onSettleDebt={settleDebt}
                        isDeleting={isDeleting}
                    />
                )}
            </div>
        </div>
    );
}
