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
import { TransactionFormValues, transactionFormSchema } from '@/types';
import { CATEGORIES as STATIC_CATEGORIES } from '@/lib/categories';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { CardBrandIcon } from './CardBrandIcon';
import { CategorySelect } from './CategorySelect';
import { CurrencyInput } from './CurrencyInput';
import { useCurrencyInput } from '@/hooks/useCurrencyInput';
import { useAccount } from '@/hooks/useAccount';
import { useCards } from '@/hooks/useCards';

interface AddTransactionModalProps {
  onAddTransaction: (data: TransactionFormValues) => Promise<any>;
  onAddTransfer?: (data: {
    sourceData: TransactionFormValues;
    destinationData: TransactionFormValues;
    destinationAccountType: string;
  }) => Promise<any>;
  isAdding?: boolean;
  className?: string;
}

export function AddTransactionModal({
  onAddTransaction,
  onAddTransfer,
  isAdding,
  className,
}: AddTransactionModalProps) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'expense',
      amount: 0,
      description: '',
      category: STATIC_CATEGORIES[0].value,
      date: new Date().toISOString().split('T')[0],
      status: 'pago',
    },
  });

  // Currency input display state (string, formatted with comma)
  const {
    display: amountDisplay,
    handleChange: handleAmountChange,
    reset: resetAmount,
  } = useCurrencyInput();

  const { accountType } = useAccount();
  const { cards } = useCards();
  const [isTransfer, setIsTransfer] = useState(false);

  const formType = watch('type');
  const selectedCardId = watch('cardId');
  const [transferType, setTransferType] = useState<'income' | 'expense'>(
    'income',
  );

  useEffect(() => {
    setTransferType(formType === 'expense' ? 'income' : 'expense');
  }, [formType, open]);

  // Permite que o FAB da navegação mobile abra o modal via evento global.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('seara:open-add-transaction', handler);
    return () =>
      window.removeEventListener('seara:open-add-transaction', handler);
  }, []);

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      if (isTransfer && onAddTransfer) {
        // Create destination transaction matching the selected type
        const destinationData: TransactionFormValues = {
          ...data,
          type: transferType,
        };
        const destAccount =
          accountType === 'personal' ? 'business' : 'personal';

        await onAddTransfer({
          sourceData: data,
          destinationData,
          destinationAccountType: destAccount,
        });
      } else {
        await onAddTransaction(data);
      }
      setOpen(false);
      reset();
      resetAmount();
      setIsTransfer(false);
    } catch (error) {
      // Handle error silently, mutation error handling will manage this
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>Nova Transação</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] max-h-[90vh] overflow-y-auto flex flex-col'>
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle>Adicionar Transação</DialogTitle>
          <DialogDescription>
            Insira os detalhes da nova transação aqui. Clique em salvar quando
            terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='category' className='text-right'>
                Categoria
              </Label>
              <div className='col-span-3'>
                <Controller
                  name='category'
                  control={control}
                  render={({ field }) => (
                    <CategorySelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.category && isSubmitted && (
                  <span className='text-red-500 text-xs'>
                    {errors.category.message}
                  </span>
                )}
              </div>
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='amount' className='text-right'>
                Valor
              </Label>
              <div className='col-span-3'>
                <Controller
                  name='amount'
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id='amount'
                      value={amountDisplay}
                      onChange={(e) => handleAmountChange(e, field.onChange)}
                    />
                  )}
                />
                {errors.amount && (
                  <span className='text-red-500 text-xs'>
                    {errors.amount.message}
                  </span>
                )}
              </div>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='description' className='text-right'>
                Descrição
              </Label>
              <div className='col-span-3'>
                <Input
                  id='description'
                  className='col-span-3'
                  placeholder='Ex: Compra no supermercado'
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
              <Label htmlFor='type' className='text-right'>
                Tipo
              </Label>
              <div className='col-span-3'>
                <Controller
                  name='type'
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Selecione o tipo' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='income'>Entrada</SelectItem>
                        <SelectItem value='expense'>Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <span className='text-red-500 text-xs'>
                    {errors.type.message}
                  </span>
                )}
              </div>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
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
                        <SelectItem value='recebido'>Recebido</SelectItem>
                        <SelectItem value='a_receber'>A Receber</SelectItem>
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
              <Label htmlFor='date' className='text-right'>
                Data
              </Label>
              <div className='col-span-3'>
                <Controller
                  name='date'
                  control={control}
                  render={({ field }) => (
                    <Input
                      id='date'
                      type='date'
                      className='col-span-3'
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                {errors.date && (
                  <span className='text-red-500 text-xs'>
                    {errors.date.message}
                  </span>
                )}
              </div>
            </div>

            {formType === 'expense' && (
              <>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='cardId' className='text-right'>
                    Pago com
                  </Label>
                  <div className='col-span-3'>
                    <Controller
                      name='cardId'
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(v) =>
                            field.onChange(v === 'account' ? undefined : v)
                          }
                          value={field.value || 'account'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Selecione a forma de pagamento' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='account'>
                              <span className='font-medium'>
                                Conta Corrente
                              </span>
                            </SelectItem>
                            {cards.map((card) => (
                              <SelectItem key={card.id!} value={card.id!}>
                                <span className='inline-flex items-center gap-2'>
                                  <CardBrandIcon
                                    brand={card.brand}
                                    className='h-4 w-auto'
                                    lucideSize={14}
                                  />
                                  <span>{card.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {selectedCardId && (
                  <div className='grid grid-cols-4 items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300'>
                    <Label htmlFor='installmentsTotal' className='text-right'>
                      Parcelas
                    </Label>
                    <div className='col-span-3'>
                      <Controller
                        name='installmentsTotal'
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={(v) => field.onChange(Number(v))}
                            value={String(field.value || 1)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='1x' />
                            </SelectTrigger>
                            <SelectContent className='max-h-[200px]'>
                              {Array.from({ length: 48 }, (_, i) => i + 1).map(
                                (n) => (
                                  <SelectItem key={n} value={String(n)}>
                                    {n}x {n > 1 ? 'vezes' : 'vez (À vista)'}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {onAddTransfer && (
              <div className='flex flex-col space-y-3 mt-2 py-4 border-t border-border/50'>
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    id='is-transfer'
                    className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                    checked={isTransfer}
                    onChange={(e) => setIsTransfer(e.target.checked)}
                  />
                  <Label
                    htmlFor='is-transfer'
                    className='cursor-pointer text-sm font-medium leading-none'
                  >
                    {`Lançar também na conta ${accountType === 'personal' ? 'Empresarial (PJ)' : 'Pessoal'}`}
                  </Label>
                </div>

                {isTransfer && (
                  <div className='pl-7 flex items-center space-x-3 animate-in fade-in duration-200'>
                    <Label className='text-sm text-muted-foreground whitespace-nowrap'>
                      Como:
                    </Label>
                    <Select
                      value={transferType}
                      onValueChange={(v: any) => setTransferType(v)}
                    >
                      <SelectTrigger className='h-8 w-[130px] bg-background'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='income'>Entrada</SelectItem>
                        <SelectItem value='expense'>Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
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
