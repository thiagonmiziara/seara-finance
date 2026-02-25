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
import { DebtFormValues, debtFormSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

interface AddDebtModalProps {
    onAddDebt: (data: DebtFormValues) => Promise<any>;
    isAdding?: boolean;
    className?: string;
}

export function AddDebtModal({
    onAddDebt,
    isAdding,
    className,
}: AddDebtModalProps) {
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
        defaultValues: {
            description: '',
            totalAmount: 0,
            installments: 1,
            installmentAmount: 0,
            status: 'a_pagar',
            dueDate: new Date().toISOString().split('T')[0],
        },
    });

    const [amountDisplay, setAmountDisplay] = useState('');
    const [installmentAmountDisplay, setInstallmentAmountDisplay] = useState('');

    // Auto-calculate installment amount
    const totalAmount = watch('totalAmount');
    const installments = watch('installments');

    useEffect(() => {
        // Only auto-calc if user hasn't typed a custom value or if total/installments change
        if (totalAmount && installments > 0) {
            const calculated = Number((totalAmount / installments).toFixed(2));
            setValue('installmentAmount', calculated);
            setInstallmentAmountDisplay(calculated.toFixed(2).replace('.', ','));
        }
    }, [totalAmount, installments, setValue]);

    const onSubmit = async (data: DebtFormValues) => {
        try {
            await onAddDebt(data);
            setOpen(false);
            reset();
            setAmountDisplay('');
            setInstallmentAmountDisplay('');
        } catch (error) {
            console.error('Failed to add debt:', error);
            // handled by mutation
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className={className}>Nova Dívida</Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle>Adicionar Dívida</DialogTitle>
                    <DialogDescription>
                        Insira os detalhes da dívida aqui.
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
                                            defaultValue={field.value}
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
                        <Button type='submit' disabled={isAdding}>
                            {isAdding ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
