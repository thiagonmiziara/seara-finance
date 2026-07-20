import { ReactNode, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
  GoalContributionFormValues,
  goalContributionFormSchema,
  GoalWithProgress,
} from '@/types';

interface GoalContributionDialogProps {
  goal: GoalWithProgress;
  trigger: ReactNode;
  onSubmit: (data: GoalContributionFormValues) => Promise<void>;
}

export function GoalContributionDialog({
  goal,
  trigger,
  onSubmit,
}: GoalContributionDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalContributionFormValues>({
    resolver: zodResolver(goalContributionFormSchema),
    defaultValues: {
      goalId: goal.id,
      amount: 0,
      contributedAt: new Date().toISOString().split('T')[0],
      note: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        goalId: goal.id,
        amount: 0,
        contributedAt: new Date().toISOString().split('T')[0],
        note: '',
      });
    }
  }, [open, goal.id, reset]);

  const submit = handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      await onSubmit({
        ...data,
        note: data.note?.trim() ? data.note : null,
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Registrar aporte</DialogTitle>
        </DialogHeader>
        <div className='text-sm text-muted-foreground -mt-1 mb-2'>
          {goal.icon ?? '🎯'} {goal.title}
        </div>

        <form onSubmit={submit} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='amount'>Valor (R$)</Label>
            <Input
              id='amount'
              type='number'
              step='0.01'
              min='0.01'
              autoFocus
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className='text-xs text-destructive'>{errors.amount.message}</p>
            )}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='contributedAt'>Data</Label>
            <Input
              id='contributedAt'
              type='date'
              {...register('contributedAt')}
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='note'>Nota (opcional)</Label>
            <Input id='note' maxLength={140} {...register('note')} />
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
              {submitting ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
