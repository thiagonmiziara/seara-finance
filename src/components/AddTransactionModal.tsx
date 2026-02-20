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
import { CATEGORIES } from '@/lib/categories';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

interface AddTransactionModalProps {
  onAddTransaction: (data: TransactionFormValues) => Promise<any>;
  isAdding?: boolean;
  className?: string;
}

export function AddTransactionModal({
  onAddTransaction,
  isAdding,
  className,
}: AddTransactionModalProps) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      description: '',
      category: CATEGORIES[0].value,
      date: new Date().toISOString().split('T')[0],
      status: 'pago',
    },
  });

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      await onAddTransaction(data);
      setOpen(false);
      reset();
    } catch (error) {
      // Handle error silently, mutation error handling will manage this
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className}>Nova Transação</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {field.value ? (
                            <span className='inline-flex items-center gap-2'>
                              <span
                                className='h-2 w-2 rounded-full'
                                style={{
                                  backgroundColor: CATEGORIES.find(
                                    (c) => c.value === field.value,
                                  )?.color,
                                }}
                              />
                              <span>
                                {CATEGORIES.find((c) => c.value === field.value)
                                  ?.label ?? field.value}
                              </span>
                            </span>
                          ) : (
                            <span className='text-muted-foreground'>
                              Selecione a categoria
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            <span className='inline-flex items-center gap-2'>
                              <span
                                className='h-2 w-2 rounded-full'
                                style={{ backgroundColor: c.color }}
                              />
                              <span>{c.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
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
                <Input
                  id='amount'
                  type='number'
                  step='0.01'
                  className='col-span-3'
                  placeholder='0,00'
                  {...register('amount', {
                    setValueAs: (value) => {
                      if (typeof value === 'string') {
                        return Number(value.replace(',', '.'));
                      }

                      return value;
                    },
                  })}
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
                <Input
                  id='date'
                  type='date'
                  className='col-span-3'
                  placeholder='Selecione uma data'
                  {...register('date')}
                />
                {errors.date && (
                  <span className='text-red-500 text-xs'>
                    {errors.date.message}
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
