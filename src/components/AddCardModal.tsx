import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCardFormValues, creditCardFormSchema } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';

interface AddCardModalProps {
    onAddCard: (data: CreditCardFormValues) => Promise<any>;
    isAdding?: boolean;
}

const colors = [
    { label: 'Roxo (Nubank)', value: '#8A05BE' },
    { label: 'Laranja (Itaú)', value: '#EC7000' },
    { label: 'Azul (Caixa)', value: '#005CA9' },
    { label: 'Amarelo (BB)', value: '#FCEB00' },
    { label: 'Preto (Black)', value: '#222222' },
    { label: 'Prata (Platinum)', value: '#A9A9A9' },
    { label: 'Verde', value: '#10B981' },
];

export function AddCardModal({ onAddCard, isAdding }: AddCardModalProps) {
    const [open, setOpen] = useState(false);
    const [amountDisplay, setAmountDisplay] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<CreditCardFormValues>({
        resolver: zodResolver(creditCardFormSchema),
        defaultValues: {
            color: '#8A05BE',
        },
    });

    const onSubmit = async (data: CreditCardFormValues) => {
        try {
            await onAddCard(data);
            setOpen(false);
            reset();
            setAmountDisplay('');
        } catch (error) {
            console.error(error);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value === '') {
            setAmountDisplay('');
            setValue('limit', 0);
            return;
        }

        const numberValue = parseInt(value, 10) / 100;
        setValue('limit', numberValue, { shouldValidate: true });

        setAmountDisplay(
            new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }).format(numberValue)
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className='gap-2 w-full sm:w-auto h-11 text-base'>
                    <PlusCircle className='h-5 w-5' />
                    Novo Cartão
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px] overflow-visible'>
                <DialogHeader>
                    <DialogTitle>Novo Cartão de Crédito</DialogTitle>
                    <DialogDescription>
                        Cadastre um novo cartão para vincular aos seus gastos e parcelamentos.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                    <div className='grid gap-4 py-4'>
                        {/* Name */}
                        <div className='space-y-2'>
                            <Label htmlFor='name'>Nome do Cartão (Ex: Nubank)</Label>
                            <Input
                                id='name'
                                placeholder='Nubank, Caixa...'
                                {...register('name')}
                            />
                            {errors.name && (
                                <span className='text-red-500 text-xs'>{errors.name.message}</span>
                            )}
                        </div>

                        {/* Limit */}
                        <div className='space-y-2'>
                            <Label htmlFor='limit'>Valor do Limite Total</Label>
                            <Input
                                id='limit'
                                value={amountDisplay}
                                onChange={handleAmountChange}
                                placeholder='R$ 0,00'
                            />
                            {errors.limit && (
                                <span className='text-red-500 text-xs'>{errors.limit.message}</span>
                            )}
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            {/* Closing Day */}
                            <div className='space-y-2'>
                                <Label htmlFor='closingDay'>Dia de Fechamento</Label>
                                <Input
                                    id='closingDay'
                                    type='number'
                                    min={1}
                                    max={31}
                                    placeholder='Ex: 8'
                                    {...register('closingDay', { valueAsNumber: true })}
                                />
                                {errors.closingDay && (
                                    <span className='text-red-500 text-xs'>{errors.closingDay.message}</span>
                                )}
                            </div>

                            {/* Due Day */}
                            <div className='space-y-2'>
                                <Label htmlFor='dueDay'>Dia de Vencimento</Label>
                                <Input
                                    id='dueDay'
                                    type='number'
                                    min={1}
                                    max={31}
                                    placeholder='Ex: 15'
                                    {...register('dueDay', { valueAsNumber: true })}
                                />
                                {errors.dueDay && (
                                    <span className='text-red-500 text-xs'>{errors.dueDay.message}</span>
                                )}
                            </div>
                        </div>

                        {/* Color */}
                        <div className='space-y-2'>
                            <Label>Cor de Identificação</Label>
                            <div className='flex gap-2 flex-wrap'>
                                {colors.map((c) => (
                                    <button
                                        key={c.value}
                                        type='button'
                                        title={c.label}
                                        onClick={() => setValue('color', c.value)}
                                        className={`h-8 w-8 rounded-full border-2 focus:ring-2 focus:ring-offset-1 transition-all
                    `}
                                        style={{
                                            backgroundColor: c.value,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className='flex justify-end space-x-2 pt-4 border-t border-border/50'>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => {
                                setOpen(false);
                                reset();
                                setAmountDisplay('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button type='submit' disabled={isAdding} className='min-w-[100px]'>
                            {isAdding ? 'Salvando...' : 'Salvar Cartão'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
