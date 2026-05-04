import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Debt, DebtFormValues, debtFormSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

interface AddDebtModalProps {
    onAddDebt?: (data: DebtFormValues) => Promise<any>;
    onUpdateDebt?: (vars: { id: string; data: Partial<DebtFormValues> }) => Promise<any>;
    debt?: Debt;
    isAdding?: boolean;
    isUpdating?: boolean;
    className?: string;
    trigger?: ReactNode;
}

const todayISO = () => new Date().toISOString().split('T')[0];

const formatBRL = (value: number) => value.toFixed(2).replace('.', ',');

const buildDefaults = (debt?: Debt): DebtFormValues => ({
    description: debt?.description ?? '',
    totalAmount: debt?.totalAmount ?? 0,
    installments: debt?.installments ?? 1,
    installmentAmount: debt?.installmentAmount ?? 0,
    paidInstallments: debt?.paidInstallments,
    status: debt?.status ?? 'a_pagar',
    dueDate: debt?.dueDate ? debt.dueDate.split('T')[0] : todayISO(),
    cardId: debt?.cardId,
});

export function AddDebtModal({
    onAddDebt,
    onUpdateDebt,
    debt,
    isAdding,
    isUpdating,
    className,
    trigger,
}: AddDebtModalProps) {
    const isEdit = !!debt;
    const [open, setOpen] = useState(false);
    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<DebtFormValues>({
        resolver: zodResolver(debtFormSchema),
        defaultValues: buildDefaults(debt),
    });

    const [amountDisplay, setAmountDisplay] = useState(
        debt ? formatBRL(debt.totalAmount) : '',
    );
    const [installmentAmountDisplay, setInstallmentAmountDisplay] = useState(
        debt ? formatBRL(debt.installmentAmount) : '',
    );
    const [installmentTouched, setInstallmentTouched] = useState(false);

    // Reset form whenever the modal opens (or the debt prop changes)
    useEffect(() => {
        if (open) {
            reset(buildDefaults(debt));
            setAmountDisplay(debt ? formatBRL(debt.totalAmount) : '');
            setInstallmentAmountDisplay(
                debt ? formatBRL(debt.installmentAmount) : '',
            );
            setInstallmentTouched(false);
        }
    }, [open, debt, reset]);

    const totalAmount = watch('totalAmount');
    const installments = watch('installments');

    // Auto-calc parcela apenas quando o usuário não editou manualmente
    useEffect(() => {
        if (installmentTouched) return;
        if (totalAmount && installments > 0) {
            const calculated = Number((totalAmount / installments).toFixed(2));
            setValue('installmentAmount', calculated);
            setInstallmentAmountDisplay(formatBRL(calculated));
        }
    }, [totalAmount, installments, setValue, installmentTouched]);

    const onSubmit = async (data: DebtFormValues) => {
        try {
            if (isEdit && onUpdateDebt && debt) {
                await onUpdateDebt({ id: debt.id, data });
            } else if (onAddDebt) {
                await onAddDebt(data);
            }
            setOpen(false);
        } catch (error) {
            console.error('Failed to save debt:', error);
        }
    };

    const handleAmountChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        onChange: (value: number) => void,
    ) => {
        const raw = e.target.value.replace(/[^0-9,]/g, '');
        const parts = raw.split(',');
        const sanitized =
            parts.length > 2 ? parts[0] + ',' + parts.slice(1).join('') : raw;
        setAmountDisplay(sanitized);
        const numeric = parseFloat(sanitized.replace(',', '.'));
        onChange(isNaN(numeric) ? 0 : numeric);
    };

    const submitting = isEdit ? isUpdating : isAdding;
    const defaultTrigger = isEdit ? (
        <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-9 w-9 p-0 text-muted-foreground hover:text-foreground'
            aria-label={`Editar dívida ${debt?.description ?? ''}`}
            title='Editar dívida'
        >
            <Pencil className='h-4 w-4' />
        </Button>
    ) : (
        <Button className={className}>Nova Dívida</Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Editar Dívida' : 'Adicionar Dívida'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Atualize os detalhes da dívida.'
                            : 'Insira os detalhes da dívida aqui.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='description' className='text-right'>
                                Descrição
                            </Label>
                            <div className='col-span-3'>
                                <Input
                                    id='description'
                                    placeholder='Ex: Financiamento do Carro'
                                    {...register('description')}
                                />
                                {errors.description && (
                                    <span className='text-red-500 text-xs'>
                                        {errors.description.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='totalAmount' className='text-right'>
                                Valor Total
                            </Label>
                            <div className='col-span-3'>
                                <Controller
                                    name='totalAmount'
                                    control={control}
                                    render={({ field }) => (
                                        <div className='flex items-center border border-input rounded-md focus-within:ring-2 focus-within:ring-ring bg-background overflow-hidden'>
                                            <span className='px-3 text-sm text-muted-foreground select-none border-r border-input h-full flex items-center'>
                                                R$
                                            </span>
                                            <input
                                                id='totalAmount'
                                                type='text'
                                                inputMode='decimal'
                                                placeholder='0,00'
                                                value={amountDisplay}
                                                onChange={(e) => handleAmountChange(e, field.onChange)}
                                                className='flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground'
                                            />
                                        </div>
                                    )}
                                />
                                {errors.totalAmount && (
                                    <span className='text-red-500 text-xs'>
                                        {errors.totalAmount.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='installments' className='text-right'>
                                Parcelas
                            </Label>
                            <div className='col-span-3'>
                                <Input
                                    id='installments'
                                    type='number'
                                    min='1'
                                    {...register('installments', { valueAsNumber: true })}
                                />
                                {errors.installments && (
                                    <span className='text-red-500 text-xs'>
                                        {errors.installments.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        {isEdit && (
                            <div className='grid grid-cols-4 items-center gap-4'>
                                <Label
                                    htmlFor='paidInstallments'
                                    className='text-right'
                                >
                                    Parcelas pagas
                                </Label>
                                <div className='col-span-3'>
                                    <Input
                                        id='paidInstallments'
                                        type='number'
                                        min='0'
                                        max={installments}
                                        {...register('paidInstallments', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                    {errors.paidInstallments && (
                                        <span className='text-red-500 text-xs'>
                                            {errors.paidInstallments.message}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className='grid grid-cols-4 items-center gap-4 border-b pb-4'>
                            <Label htmlFor='installmentAmount' className='text-right'>
                                Valor da Parcela
                            </Label>
                            <div className='col-span-3'>
                                <Controller
                                    name='installmentAmount'
                                    control={control}
                                    render={({ field }) => (
                                        <div className='flex items-center border border-input rounded-md focus-within:ring-2 focus-within:ring-ring bg-background overflow-hidden'>
                                            <span className='px-3 text-sm text-muted-foreground select-none border-r border-input h-full flex items-center'>
                                                R$
                                            </span>
                                            <input
                                                id='installmentAmount'
                                                type='text'
                                                inputMode='decimal'
                                                placeholder='0,00'
                                                value={installmentAmountDisplay}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(/[^0-9,]/g, '');
                                                    const parts = raw.split(',');
                                                    const sanitized = parts.length > 2 ? parts[0] + ',' + parts.slice(1).join('') : raw;
                                                    setInstallmentAmountDisplay(sanitized);
                                                    setInstallmentTouched(true);
                                                    const numeric = parseFloat(sanitized.replace(',', '.'));
                                                    field.onChange(isNaN(numeric) ? 0 : numeric);
                                                }}
                                                className='flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground'
                                            />
                                        </div>
                                    )}
                                />
                                {errors.installmentAmount && (
                                    <span className='text-red-500 text-xs'>
                                        {errors.installmentAmount.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className='grid grid-cols-4 items-center gap-4 mt-2'>
                            <Label htmlFor='status' className='text-right'>
                                Status
                            </Label>
                            <div className='col-span-3'>
                                <Controller
                                    name='status'
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder='Selecione o status' />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value='pago'>Pago</SelectItem>
                                                <SelectItem value='a_pagar'>A Pagar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.status && (
                                    <span className='text-red-500 text-xs'>
                                        {errors.status.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='dueDate' className='text-right'>
                                Vencimento
                            </Label>
                            <div className='col-span-3'>
                                <Input
                                    id='dueDate'
                                    type='date'
                                    {...register('dueDate')}
                                />
                                {errors.dueDate && (
                                    <span className='text-red-500 text-xs'>
                                        {errors.dueDate.message}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type='submit' disabled={submitting}>
                            {submitting ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
