import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Archive,
  MoreVertical,
  Pencil,
  PlusCircle,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  GoalContributionFormValues,
  GoalFormValues,
  GoalWithProgress,
} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from './ConfirmDialog';
import { GoalContributionDialog } from './GoalContributionDialog';
import { GoalFormDialog } from './GoalFormDialog';
import { cn } from '@/lib/utils';

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);

const fmtBRLPrecise = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v);

interface GoalCardProps {
  goal: GoalWithProgress;
  onUpdate: (data: GoalFormValues) => Promise<void>;
  onAddContribution: (data: GoalContributionFormValues) => Promise<void>;
  onArchive: () => Promise<void>;
  onReactivate: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function GoalCard({
  goal,
  onUpdate,
  onAddContribution,
  onArchive,
  onReactivate,
  onDelete,
}: GoalCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const pct = Math.min(1, Math.max(0, goal.progress));
  const pctLabel = `${Math.round(goal.progress * 100)}%`;
  const accent = goal.color ?? '#22a85c';

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const isDone = goal.isCompleted;

  return (
    <>
      <Card className='overflow-hidden'>
        <div
          className='h-1 w-full'
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <CardContent className='p-4 space-y-3'>
          <div className='flex items-start gap-3'>
            <div
              className='h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0'
              style={{ backgroundColor: `${accent}22` }}
            >
              {goal.icon ?? '🎯'}
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 flex-wrap'>
                <h3 className='font-semibold truncate'>{goal.title}</h3>
                {isDone && (
                  <span className='text-[10px] uppercase font-bold tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5'>
                    Concluído
                  </span>
                )}
                {goal.status === 'archived' && (
                  <span className='text-[10px] uppercase font-bold tracking-wider bg-muted text-muted-foreground rounded-full px-2 py-0.5'>
                    Arquivado
                  </span>
                )}
                {goal.kind === 'retirement' && (
                  <span className='text-[10px] uppercase font-bold tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-full px-2 py-0.5'>
                    Aposentadoria
                  </span>
                )}
              </div>
              {goal.description && (
                <p className='text-xs text-muted-foreground truncate'>
                  {goal.description}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className='mr-2 h-4 w-4' /> Editar
                </DropdownMenuItem>
                {goal.status === 'archived' ? (
                  <DropdownMenuItem onClick={() => onReactivate()}>
                    <Undo2 className='mr-2 h-4 w-4' /> Reativar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onArchive()}>
                    <Archive className='mr-2 h-4 w-4' /> Arquivar
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setConfirmDeleteOpen(true)}
                  className='text-destructive focus:text-destructive'
                >
                  <Trash2 className='mr-2 h-4 w-4' /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className='space-y-1.5'>
            <div className='flex items-end justify-between gap-2'>
              <div className='min-w-0'>
                <div className='text-2xl font-extrabold tracking-tight tabular-nums truncate'>
                  {fmtBRL(goal.currentAmount)}
                </div>
                <div className='text-xs text-muted-foreground'>
                  de {fmtBRL(goal.targetAmount)}
                </div>
              </div>
              <div className='text-right shrink-0'>
                <div
                  className='text-sm font-bold tabular-nums'
                  style={{ color: accent }}
                >
                  {pctLabel}
                </div>
                {goal.targetDate && (
                  <div className='text-[11px] text-muted-foreground'>
                    até{' '}
                    {format(parseISO(goal.targetDate), 'MMM/yyyy', {
                      locale: ptBR,
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
              <div
                className={cn('h-full rounded-full transition-all')}
                style={{
                  width: `${pct * 100}%`,
                  backgroundColor: accent,
                }}
              />
            </div>
          </div>

          {!isDone &&
            goal.suggestedMonthly !== null &&
            goal.suggestedMonthly > 0 && (
              <div className='rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs'>
                <div className='font-semibold'>
                  Aporte sugerido: {fmtBRLPrecise(goal.suggestedMonthly)}/mês
                </div>
                <div className='text-muted-foreground'>
                  Faltam {fmtBRL(remaining)} em {goal.monthsRemaining}{' '}
                  {goal.monthsRemaining === 1 ? 'mês' : 'meses'}
                </div>
              </div>
            )}

          {!isDone &&
            goal.targetDate &&
            goal.monthsRemaining !== null &&
            goal.monthsRemaining <= 0 && (
              <div className='rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400'>
                Prazo já passou. Edite o objetivo pra ajustar a data.
              </div>
            )}

          {goal.status === 'active' && (
            <GoalContributionDialog
              goal={goal}
              onSubmit={onAddContribution}
              trigger={
                <Button variant='outline' className='w-full' size='sm'>
                  <PlusCircle className='mr-2 h-4 w-4' />
                  Registrar aporte
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <GoalFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={goal}
        onSubmit={onUpdate}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title='Excluir objetivo?'
        description={`O objetivo "${goal.title}" e seus aportes serão removidos permanentemente.`}
        onConfirm={async () => {
          await onDelete();
        }}
      />
    </>
  );
}
