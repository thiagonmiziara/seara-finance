import { useMemo, useState } from 'react';
import { ChevronDown, Plus, Target } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { GoalCard } from '@/components/GoalCard';
import { GoalFormDialog } from '@/components/GoalFormDialog';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

export default function GoalsPage() {
  const {
    goals,
    isLoading,
    addGoal,
    updateGoal,
    setGoalStatus,
    deleteGoal,
    addContribution,
  } = useGoals();

  const [showArchived, setShowArchived] = useState(false);

  const active = useMemo(
    () => goals.filter((g) => g.status === 'active'),
    [goals],
  );
  const completed = useMemo(
    () => goals.filter((g) => g.status === 'completed'),
    [goals],
  );
  const archived = useMemo(
    () => goals.filter((g) => g.status === 'archived'),
    [goals],
  );

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
        <div>
          <h1 className='text-3xl font-extrabold tracking-tight font-display'>
            Objetivos
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Planeje sua viagem, casa, aposentadoria e qualquer sonho. Acompanhe
            o quanto já guardou e o aporte mensal sugerido pra chegar lá.
          </p>
        </div>
        <GoalFormDialog
          onSubmit={async (data) => {
            await addGoal(data);
            showToast({ message: 'Objetivo criado!', type: 'success' });
          }}
          trigger={
            <Button className='shrink-0'>
              <Plus className='mr-2 h-4 w-4' />
              Novo objetivo
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {[0, 1, 2].map((i) => (
            <div key={i} className='h-48 rounded-xl bg-muted animate-pulse' />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          onCreate={async (data) => {
            await addGoal(data);
            showToast({ message: 'Primeiro objetivo criado!', type: 'success' });
          }}
        />
      ) : (
        <>
          {active.length > 0 && (
            <section className='space-y-3'>
              <h2 className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>
                Em andamento ({active.length})
              </h2>
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {active.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onUpdate={(data) => updateGoal({ id: g.id, data })}
                    onAddContribution={async (data) => {
                      await addContribution({ ...data, goalId: g.id });
                      showToast({
                        message: 'Aporte registrado!',
                        type: 'success',
                      });
                    }}
                    onArchive={() =>
                      setGoalStatus({ id: g.id, status: 'archived' })
                    }
                    onReactivate={() =>
                      setGoalStatus({ id: g.id, status: 'active' })
                    }
                    onDelete={async () => {
                      await deleteGoal(g.id);
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className='space-y-3'>
              <h2 className='text-sm font-bold uppercase tracking-widest text-muted-foreground'>
                Concluídos ({completed.length})
              </h2>
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {completed.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onUpdate={(data) => updateGoal({ id: g.id, data })}
                    onAddContribution={async (data) => {
                      await addContribution({ ...data, goalId: g.id });
                    }}
                    onArchive={() =>
                      setGoalStatus({ id: g.id, status: 'archived' })
                    }
                    onReactivate={() =>
                      setGoalStatus({ id: g.id, status: 'active' })
                    }
                    onDelete={async () => {
                      await deleteGoal(g.id);
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {archived.length > 0 && (
            <section className='space-y-3'>
              <button
                type='button'
                onClick={() => setShowArchived((v) => !v)}
                className='flex items-center gap-1 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors'
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    showArchived ? 'rotate-0' : '-rotate-90',
                  )}
                />
                Arquivados ({archived.length})
              </button>
              {showArchived && (
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                  {archived.map((g) => (
                    <GoalCard
                      key={g.id}
                      goal={g}
                      onUpdate={(data) => updateGoal({ id: g.id, data })}
                      onAddContribution={async (data) => {
                        await addContribution({ ...data, goalId: g.id });
                      }}
                      onArchive={() =>
                        setGoalStatus({ id: g.id, status: 'archived' })
                      }
                      onReactivate={() =>
                        setGoalStatus({ id: g.id, status: 'active' })
                      }
                      onDelete={async () => {
                        await deleteGoal(g.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({
  onCreate,
}: {
  onCreate: (data: Parameters<ReturnType<typeof useGoals>['addGoal']>[0]) => Promise<void>;
}) {
  return (
    <div className='rounded-2xl border border-dashed border-border/60 p-10 text-center space-y-4'>
      <div className='mx-auto h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center'>
        <Target className='h-6 w-6' />
      </div>
      <div>
        <h3 className='font-display font-extrabold text-lg'>
          Que sonho você quer realizar?
        </h3>
        <p className='text-sm text-muted-foreground mt-1 max-w-md mx-auto'>
          Crie objetivos para juntar dinheiro pra viagem, troca de carro,
          reforma da casa ou pra construir sua aposentadoria. A gente calcula
          quanto guardar por mês pra chegar no prazo.
        </p>
      </div>
      <GoalFormDialog
        onSubmit={onCreate}
        trigger={
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Criar primeiro objetivo
          </Button>
        }
      />
    </div>
  );
}
