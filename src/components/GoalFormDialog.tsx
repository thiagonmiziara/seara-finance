import { ReactNode, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Goal, GoalFormValues, goalFormSchema } from '@/types';
import { cn } from '@/lib/utils';

const COLOR_PALETTE = [
  '#22a85c',
  '#10b981',
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#f97316',
  '#ec4899',
];

const EMOJI_PALETTE = ['🎯', '✈️', '🏠', '🚗', '🎓', '👴', '💍', '🏖️'];

interface GoalFormDialogProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initial?: Goal;
  onSubmit: (data: GoalFormValues) => Promise<void>;
  title?: string;
}

export function GoalFormDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  initial,
  onSubmit,
  title,
}: GoalFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? !!controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      targetAmount: initial?.targetAmount ?? 0,
      initialAmount: initial?.initialAmount ?? 0,
      targetDate: initial?.targetDate ?? '',
      kind: initial?.kind ?? 'savings',
      icon: initial?.icon ?? '🎯',
      color: initial?.color ?? COLOR_PALETTE[0],
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: initial?.title ?? '',
        description: initial?.description ?? '',
        targetAmount: initial?.targetAmount ?? 0,
        initialAmount: initial?.initialAmount ?? 0,
        targetDate: initial?.targetDate ?? '',
        kind: initial?.kind ?? 'savings',
        icon: initial?.icon ?? '🎯',
        color: initial?.color ?? COLOR_PALETTE[0],
      });
    }
  }, [open, initial, reset]);

  const icon = watch('icon');
  const color = watch('color');

  const submit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const payload: GoalFormValues = {
        ...data,
        targetDate: data.targetDate ? data.targetDate : null,
        description: data.description?.trim() ? data.description : null,
      };
      await onSubmit(payload);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {title ?? (initial ? 'Editar objetivo' : 'Novo objetivo')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className='space-y-4 mt-2'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div className='space-y-1.5 sm:col-span-2'>
              <Label htmlFor='title'>Título</Label>
              <Input
                id='title'
                placeholder='Ex.: Viagem pra Europa'
                autoFocus
                {...register('title')}
              />
              {errors.title && (
                <p className='text-xs text-destructive'>{errors.title.message}</p>
              )}
            </div>

            <div className='space-y-1.5'>
              <Label>Tipo</Label>
              <Controller
                name='kind'
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='savings'>Poupança / projeto</SelectItem>
                      <SelectItem value='retirement'>Aposentadoria</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='targetDate'>Prazo (opcional)</Label>
              <Input
                id='targetDate'
                type='date'
                {...register('targetDate')}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='targetAmount'>Valor alvo (R$)</Label>
              <Input
                id='targetAmount'
                type='number'
                step='0.01'
                min='0.01'
                {...register('targetAmount', { valueAsNumber: true })}
              />
              {errors.targetAmount && (
                <p className='text-xs text-destructive'>
                  {errors.targetAmount.message}
                </p>
              )}
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='initialAmount'>Já tenho guardado (R$)</Label>
              <Input
                id='initialAmount'
                type='number'
                step='0.01'
                min='0'
                {...register('initialAmount', { valueAsNumber: true })}
              />
              {errors.initialAmount && (
                <p className='text-xs text-destructive'>
                  {errors.initialAmount.message}
                </p>
              )}
            </div>

            <div className='space-y-1.5 sm:col-span-2'>
              <Label htmlFor='description'>Descrição (opcional)</Label>
              <Input
                id='description'
                placeholder='O que vai te motivar...'
                {...register('description')}
              />
            </div>

            <div className='space-y-2 sm:col-span-2'>
              <Label>Ícone</Label>
              <div className='flex flex-wrap gap-2'>
                {EMOJI_PALETTE.map((e) => (
                  <button
                    key={e}
                    type='button'
                    onClick={() => setValue('icon', e, { shouldDirty: true })}
                    className={cn(
                      'h-10 w-10 rounded-lg border-2 text-xl transition-all',
                      icon === e
                        ? 'border-foreground scale-110'
                        : 'border-transparent bg-muted hover:scale-105',
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className='space-y-2 sm:col-span-2'>
              <Label>Cor</Label>
              <div className='flex flex-wrap gap-2'>
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type='button'
                    onClick={() => setValue('color', c, { shouldDirty: true })}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-all',
                      color === c
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting
                ? 'Salvando...'
                : initial
                  ? 'Salvar'
                  : 'Criar objetivo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
