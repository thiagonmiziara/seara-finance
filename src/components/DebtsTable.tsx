import { Debt } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck, Trash2, MoreVertical } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


interface DebtsTableProps {
    debts: Debt[];
    onDelete: (id: string) => Promise<any>;
    onIncrementInstallment: (debt: Debt) => Promise<any>;
    onSettleDebt: (debt: Debt) => Promise<any>;
    isDeleting: boolean;
}

export function DebtsTable({ debts, onDelete, onIncrementInstallment, onSettleDebt, isDeleting }: DebtsTableProps) {
    if (debts.length === 0) {
        return (
            <div className='flex flex-col items-center justify-center p-8 text-center bg-card rounded-xl border border-border/50'>
                <p className='text-muted-foreground'>Nenhuma dívida registrada ainda.</p>
            </div>
        );
    }

    return (
        <div className='w-full'>
            {/* Mobile Cards View */}
            <div className='block md:hidden space-y-4 mb-4'>
                {debts.map((debt) => {
                    const firstDueDate = debt.dueDate ? parseISO(debt.dueDate) : null;
                    let passedInstallments = debt.paidInstallments || 0;
                    if (debt.status === 'pago') {
                        passedInstallments = debt.installments;
                    }
                    const remainingInstallments = debt.installments - passedInstallments;
                    let payoffDate = null;
                    if (firstDueDate) {
                        payoffDate = addMonths(firstDueDate, debt.installments - 1);
                    }
                    const progressPercentage = Math.round((passedInstallments / debt.installments) * 100);

                    return (
                        <div
                            key={debt.id}
                            className='bg-card border border-border/50 rounded-xl p-4 shadow-sm space-y-3 relative overflow-hidden group transition-all hover:border-primary/30'
                        >
                            <div className='flex justify-between items-start'>
                                <div className='space-y-1'>
                                    <h4 className='font-semibold text-zinc-900 dark:text-zinc-100 capitalize'>
                                        {debt.description}
                                    </h4>
                                    <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        <span>
                                            {firstDueDate ? format(firstDueDate, 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            Até {payoffDate ? format(payoffDate, 'MMM/yyyy', { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase()) : '-'}
                                        </span>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='h-8 w-8 text-muted-foreground'
                                        >
                                            <MoreVertical className='h-4 w-4' />
                                            <span className='sr-only'>Ações</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        {debt.status !== 'pago' && (
                                            <>
                                                <DropdownMenuItem
                                                    onClick={() => onIncrementInstallment(debt)}
                                                    className="text-emerald-500 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                                                >
                                                    <Check className='mr-2 h-4 w-4' />
                                                    <span>Pagar 1 Parcela</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onSettleDebt(debt)}
                                                    className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                                                >
                                                    <CheckCheck className='mr-2 h-4 w-4' />
                                                    <span>Quitar Dívida</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        <DropdownMenuItem
                                            disabled={isDeleting}
                                            onClick={() => onDelete(debt.id)}
                                            className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                        >
                                            <Trash2 className='mr-2 h-4 w-4' />
                                            <span>Excluir dívida</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                            </div>

                            <div className='flex items-center justify-between'>
                                <div>
                                    <div className='text-xl font-bold tracking-tight'>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(debt.totalAmount)}
                                    </div>
                                    <p className='text-[10px] text-muted-foreground font-medium'>
                                        {debt.installments}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(debt.installmentAmount)}
                                    </p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-current/10 ${debt.status === 'pago' || remainingInstallments === 0
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {debt.status === 'pago' || remainingInstallments === 0 ? 'Pago' : 'A Pagar'}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-border/50">
                                <div className="flex justify-between text-[10px] font-medium text-muted-foreground mb-1">
                                    <span>{passedInstallments} de {debt.installments} parcelas pagas</span>
                                    <span>{progressPercentage}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop Table View */}
            <div className='hidden md:block rounded-xl border border-border/50 bg-card overflow-hidden'>
                <div className='overflow-x-auto'>
                    <Table>
                        <TableHeader>
                            <TableRow className='hover:bg-transparent'>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Valor Total</TableHead>
                                <TableHead>Parcelas</TableHead>
                                <TableHead>Progresso</TableHead>
                                <TableHead>Valor da Parcela</TableHead>
                                <TableHead>1º Vencimento</TableHead>
                                <TableHead>Previsão de Quitação</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className='text-right'>Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {debts.map((debt) => {
                                const firstDueDate = debt.dueDate ? parseISO(debt.dueDate) : null;

                                let passedInstallments = debt.paidInstallments || 0;
                                if (debt.status === 'pago') {
                                    passedInstallments = debt.installments;
                                }

                                const remainingInstallments = debt.installments - passedInstallments;
                                let payoffDate = null;

                                if (firstDueDate) {
                                    payoffDate = addMonths(firstDueDate, debt.installments - 1);
                                }

                                const progressPercentage = Math.round((passedInstallments / debt.installments) * 100);

                                return (
                                    <TableRow key={debt.id}>
                                        <TableCell className='font-medium'>{debt.description}</TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            }).format(debt.totalAmount)}
                                        </TableCell>
                                        <TableCell>{debt.installments}x</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 w-[120px]">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{passedInstallments}/{debt.installments}</span>
                                                    <span>{progressPercentage}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                                        style={{ width: `${progressPercentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {remainingInstallments > 0 ? `Faltam ${remainingInstallments}` : 'Paga'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            }).format(debt.installmentAmount)}
                                        </TableCell>
                                        <TableCell>
                                            {firstDueDate
                                                ? format(firstDueDate, 'dd/MM/yyyy', {
                                                    locale: ptBR,
                                                })
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {payoffDate
                                                ? format(payoffDate, 'MMM/yyyy', {
                                                    locale: ptBR,
                                                }).replace(/^\w/, (c) => c.toUpperCase())
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${debt.status === 'pago' || remainingInstallments === 0
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}
                                            >
                                                {debt.status === 'pago' || remainingInstallments === 0 ? 'Pago' : 'A Pagar'}
                                            </span>
                                        </TableCell>
                                        <TableCell className='text-right'>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        className='h-8 w-8 text-muted-foreground'
                                                    >
                                                        <MoreVertical className='h-4 w-4' />
                                                        <span className='sr-only'>Ações</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    {debt.status !== 'pago' && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() => onIncrementInstallment(debt)}
                                                                className="text-emerald-500 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                                                            >
                                                                <Check className='mr-2 h-4 w-4' />
                                                                <span>Pagar 1 Parcela</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => onSettleDebt(debt)}
                                                                className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                                                            >
                                                                <CheckCheck className='mr-2 h-4 w-4' />
                                                                <span>Quitar Dívida</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                        </>
                                                    )}
                                                    <DropdownMenuItem
                                                        disabled={isDeleting}
                                                        onClick={() => onDelete(debt.id)}
                                                        className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                                    >
                                                        <Trash2 className='mr-2 h-4 w-4' />
                                                        <span>Excluir</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
