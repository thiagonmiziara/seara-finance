import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { RecurringBill, RecurringBillFormValues, recurringBillFormSchema } from '@/types';
import { CATEGORIES as STATIC_CATEGORIES } from '@/lib/categories';
import { useCategories } from '@/hooks/useCategories';
import { Plus, Pencil, Trash } from 'lucide-react';

interface AddRecurringBillModalProps {
  onSave: (data: RecurringBillFormValues) => Promise<any>;
  isSaving?: boolean;
  /** Pass to open in edit mode */
  initialData?: RecurringBill;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AddRecurringBillModal({
  onSave,
  isSaving,
  initialData,
  open,
  onOpenChange,
  trigger,
}: AddRecurringBillModalProps) {
  const {
    categories: dynamicCategories,
    addCategory,
    deleteCategory,
  } = useCategories();
  const allCategories =
    dynamicCategories.length > 0 ? dynamicCategories : STATIC_CATEGORIES;

  const [amountDisplay, setAmountDisplay] = useState(
    initialData ? String(initialData.amount).replace('.', ',') : '',
  );

  const [showManage, setShowManage] = useState(false);
  const [confirmCategory, setConfirmCategory] = useState<null | {
    value: string;
    label: string;
    color: string;
  }>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RecurringBillFormValues>({
    resolver: zodResolver(recurringBillFormSchema),
    defaultValues: initialData
      ? {
          description: initialData.description,
          amount: initialData.amount,
          category: initialData.category,
          type: initialData.type,
          dueDay: initialData.dueDay,
          isActive: initialData.isActive,
        }
      : {
          type: 'expense',
          amount: 0,
          dueDay: 10,
          isActive: true,
          category: STATIC_CATEGORIES[0].value,
        },
  });

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

  const onSubmit = async (data: RecurringBillFormValues) => {
    await onSave(data);
    reset();
    setAmountDisplay('');
    onOpenChange(false);
  };

  return (
    <>
      {trigger && <span onClick={() => onOpenChange(true)}>{trigger}</span>}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-[420px] max-h-[90vh] overflow-y-auto flex flex-col'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle>
              {initialData ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}
            </DialogTitle>
            <DialogDescription>
              Contas fixas geram lançamentos automáticos todo mês.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 py-2 flex-1'>
            {/* Description */}
            <div className='flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-1.5 sm:gap-3'>
              <Label className='text-left sm:text-right text-sm font-medium'>Nome</Label>
              <div className='sm:col-span-3'>
                <Input
                  placeholder='Ex: Luz, Netflix, Aluguel...'
                  {...register('description')}
                />
                {errors.description && (
                  <span className='text-xs text-red-500'>
                    {errors.description.message}
                  </span>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className='flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-1.5 sm:gap-3'>
              <Label className='text-left sm:text-right text-sm font-medium'>Valor</Label>
              <div className='sm:col-span-3'>
                <Controller
                  name='amount'
                  control={control}
                  render={({ field }) => (
                    <div className='flex items-center border border-input rounded-md focus-within:ring-2 focus-within:ring-ring bg-background overflow-hidden'>
                      <span className='px-3 text-sm text-muted-foreground select-none border-r border-input h-full flex items-center'>
                        R$
                      </span>
                      <input
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
                {errors.amount && (
                  <span className='text-xs text-red-500'>
                    {errors.amount.message}
                  </span>
                )}
              </div>
            </div>

            {/* Category */}
            <div className='flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-1.5 sm:gap-3'>
              <Label className='text-left sm:text-right text-sm font-medium'>Categoria</Label>
              <div className='sm:col-span-3'>
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
                                  backgroundColor: (
                                    dynamicCategories.find(
                                      (c) => c.value === field.value,
                                    ) ||
                                    STATIC_CATEGORIES.find(
                                      (c) => c.value === field.value,
                                    )
                                  )?.color,
                                }}
                              />
                              <span>
                                {(
                                  dynamicCategories.find(
                                    (c) => c.value === field.value,
                                  ) ||
                                  STATIC_CATEGORIES.find(
                                    (c) => c.value === field.value,
                                  )
                                )?.label ?? field.value}
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
                        {allCategories.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            <span className='inline-flex items-center gap-2'>
                              <span
                                className='h-2 w-2 rounded-full'
                                style={{ backgroundColor: c.color }}
                              />
                              {c.label}
                            </span>
                          </SelectItem>
                        ))}
                        <SelectItem key='criar_categoria' value='criar_categoria'>
                          + Criar categoria
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                {/* Manage custom categories */}
                {dynamicCategories.some(
                  (c) => !STATIC_CATEGORIES.find((s) => s.value === c.value),
                ) && (
                  <div className='mt-2'>
                    <button
                      type='button'
                      className='text-xs text-muted-foreground underline'
                      onClick={() => setShowManage((s) => !s)}
                    >
                      {showManage ? 'Fechar gerenciamento' : 'Gerenciar categorias'}
                    </button>

                    {showManage && (
                      <div className='mt-2 space-y-2'>
                        {dynamicCategories
                          .filter(
                            (c) => !STATIC_CATEGORIES.find((s) => s.value === c.value),
                          )
                          .map((c) => (
                            <div
                              key={c.value}
                              className='flex items-center gap-2 bg-card p-2 rounded-md border border-border/40'
                            >
                              <span
                                className='inline-block h-2 w-2 rounded-full'
                                style={{ backgroundColor: c.color }}
                              />
                              <span className='flex-1 text-xs'>{c.label}</span>
                              <button
                                type='button'
                                className='p-1 rounded hover:bg-muted/20'
                                onClick={() => {
                                  setConfirmCategory({
                                    value: c.value,
                                    label: c.label,
                                    color: c.color,
                                  });
                                  setConfirmOpen(true);
                                }}
                                aria-label={`Remover ${c.label}`}
                              >
                                <Trash className='h-3.5 w-3.5 text-red-400' />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Controller
              name='category'
              control={control}
              render={({ field }) =>
                field.value === 'criar_categoria' ? (
                  <div className='flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-1.5 sm:gap-3'>
                    <Label className='text-left sm:text-right text-sm font-medium'>Nova Categoria</Label>
                    <div className='sm:col-span-3 flex gap-2'>
                      <Input
                        placeholder='Nome...'
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className='flex-1'
                      />
                      <Button
                        type='button'
                        size='sm'
                        onClick={async () => {
                          if (!newCategoryName.trim()) return;
                          try {
                            setCreating(true);
                            const created = await addCategory({
                              label: newCategoryName.trim(),
                            });
                            field.onChange(created.value);
                            setNewCategoryName('');
                          } catch (e) {} finally {
                            setCreating(false);
                          }
                        }}
                      >
                        {creating ? '...' : 'Criar'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <></>
                )
              }
            />

            {/* Type */}
            <div className='flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-1.5 sm:gap-3'>
              <Label className='text-left sm:text-right text-sm font-medium'>Tipo</Label>
              <div className='sm:col-span-3'>
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
                        <SelectItem value='expense'>Saída (despesa)</SelectItem>
                        <SelectItem value='income'>Entrada (receita)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Due Day */}
            <div className='flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-1.5 sm:gap-3'>
              <Label className='text-left sm:text-right text-sm font-medium'>Dia do venc.</Label>
              <div className='sm:col-span-3'>
                <Controller
                  name='dueDay'
                  control={control}
                  render={({ field }) => (
                    <Input
                      type='number'
                      min={1}
                      max={31}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      placeholder='Ex: 10'
                    />
                  )}
                />
                {errors.dueDay && (
                  <span className='text-xs text-red-500'>
                    {errors.dueDay.message}
                  </span>
                )}
              </div>
            </div>

            {/* Active toggle */}
            <div className='flex flex-col sm:grid sm:grid-cols-4 sm:items-start gap-1.5 sm:gap-3'>
              <Label className='text-left sm:text-right text-sm font-medium sm:mt-1'>Ativa</Label>
              <div className='sm:col-span-3 flex items-center gap-2'>
                <Controller
                  name='isActive'
                  control={control}
                  render={({ field }) => (
                    <button
                      type='button'
                      role='switch'
                      aria-checked={field.value}
                      onClick={() => field.onChange(!field.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        field.value ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          field.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                />
                <span className='text-sm text-muted-foreground'>
                  Gera lançamento todo mês automaticamente
                </span>
              </div>
            </div>

            <DialogFooter className='mt-4 flex-shrink-0'>
              <Button type='submit' disabled={isSaving}>
                {isSaving ? 'Salvando...' : initialData ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Delete Confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a categoria '
              {confirmCategory?.label}'? Isso não removerá as transações
              existentes associadas a ela.
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-end gap-3 mt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={async () => {
                if (confirmCategory) {
                  try {
                    await deleteCategory(confirmCategory.value);
                    setConfirmOpen(false);
                    setConfirmCategory(null);
                  } catch (e) {
                    console.error('Failed to delete category', e);
                  }
                }
              }}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Convenience trigger button for creating a new recurring bill */
export function NewRecurringBillButton({
  onSave,
  isSaving,
}: {
  onSave: (data: RecurringBillFormValues) => Promise<any>;
  isSaving?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size='sm' variant='outline' onClick={() => setOpen(true)}>
        <Plus className='h-4 w-4 mr-1' />
        Nova
      </Button>
      <AddRecurringBillModal
        open={open}
        onOpenChange={setOpen}
        onSave={onSave}
        isSaving={isSaving}
      />
    </>
  );
}

/** Pre-wired edit button */
export function EditRecurringBillButton({
  bill,
  onSave,
  isSaving,
}: {
  bill: RecurringBill;
  onSave: (data: RecurringBillFormValues) => Promise<any>;
  isSaving?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type='button'
        title='Editar'
        onClick={() => setOpen(true)}
        className='p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors'
      >
        <Pencil className='h-3.5 w-3.5' />
      </button>
      <AddRecurringBillModal
        open={open}
        onOpenChange={setOpen}
        onSave={onSave}
        isSaving={isSaving}
        initialData={bill}
      />
    </>
  );
}
