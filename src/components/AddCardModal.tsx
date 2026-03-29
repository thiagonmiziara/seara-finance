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
import { CardBrandIcon } from './CardBrandIcon';
import {
  detectCardBrand,
  formatCardNumber,
  maxCardDigits,
} from '@/lib/cardBrand';

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
  const [plannedAmountDisplay, setPlannedAmountDisplay] = useState('');
  const [cardNumberDisplay, setCardNumberDisplay] = useState('');
  const [detectedBrand, setDetectedBrand] =
    useState<CreditCardFormValues['brand']>(undefined);

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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const brand = detectCardBrand(raw);
    const max = maxCardDigits(brand);
    const capped = raw.slice(0, max);
    setCardNumberDisplay(formatCardNumber(capped));
    setDetectedBrand(brand);
    setValue('brand', brand, { shouldValidate: true });
    const last4 = capped.length >= 4 ? capped.slice(-4) : undefined;
    setValue('lastFour', last4, { shouldValidate: true });
  };

  const onSubmit = async (data: CreditCardFormValues) => {
    try {
      await onAddCard(data);
      setOpen(false);
      reset();
      setAmountDisplay('');
      setPlannedAmountDisplay('');
      setCardNumberDisplay('');
      setDetectedBrand(undefined);
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
      }).format(numberValue),
    );
  };

  const handlePlannedAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      setPlannedAmountDisplay('');
      setValue('limit_user_defined', undefined);
      return;
    }

    const numberValue = parseInt(value, 10) / 100;
    setValue('limit_user_defined', numberValue, { shouldValidate: true });

    setPlannedAmountDisplay(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(numberValue),
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
            Cadastre um novo cartão para vincular aos seus gastos e
            parcelamentos.
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
                <span className='text-red-500 text-xs'>
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* Limit */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='limit' className='truncate block'>Limite do Banco</Label>
                <Input
                  id='limit'
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  placeholder='R$ 0,00'
                />
                {errors.limit && (
                  <span className='text-red-500 text-xs'>
                    {errors.limit.message}
                  </span>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='limit_user_defined' className='truncate block'>
                  Limite Planejado
                </Label>
                <Input
                  id='limit_user_defined'
                  value={plannedAmountDisplay}
                  onChange={handlePlannedAmountChange}
                  placeholder='R$ 0,00 (Opcional)'
                />
                {errors.limit_user_defined && (
                  <span className='text-red-500 text-xs'>
                    {errors.limit_user_defined.message}
                  </span>
                )}
              </div>
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
                  <span className='text-red-500 text-xs'>
                    {errors.closingDay.message}
                  </span>
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
                  <span className='text-red-500 text-xs'>
                    {errors.dueDay.message}
                  </span>
                )}
              </div>
            </div>

            {/* Brand & Card Number */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <div className='h-px flex-1 bg-border/60' />
                <span className='text-xs text-muted-foreground whitespace-nowrap'>
                  Informações do cartão (opcional)
                </span>
                <div className='h-px flex-1 bg-border/60' />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='cardNumber'>Número do Cartão</Label>
              <div className='relative flex items-center'>
                <Input
                  id='cardNumber'
                  inputMode='numeric'
                  placeholder='0000 0000 0000 0000'
                  value={cardNumberDisplay}
                  onChange={handleCardNumberChange}
                  className='pr-14 font-mono tracking-widest'
                />
                <span className='absolute right-3 flex items-center'>
                  <CardBrandIcon
                    brand={detectedBrand}
                    className='h-6 w-auto'
                    lucideSize={18}
                  />
                </span>
              </div>
              <p className='text-xs text-muted-foreground'>
                Apenas a bandeira e os últimos 4 dígitos serão salvos.
              </p>
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
                setPlannedAmountDisplay('');
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
