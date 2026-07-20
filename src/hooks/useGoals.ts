import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarMonths, parseISO } from 'date-fns';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stripUndefined } from '@/lib/firestore';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import {
  Goal,
  GoalContribution,
  GoalContributionFormValues,
  GoalFormValues,
  GoalStatus,
  GoalWithProgress,
} from '@/types';

const num = (v: unknown) =>
  v === null || v === undefined ? 0 : typeof v === 'string' ? Number(v) : (v as number);

/**
 * Calcula o progresso de uma meta a partir do valor inicial + aportes manuais.
 * (Vínculo de transações a metas não existe nesta versão.)
 */
function computeProgress(
  goal: Goal,
  contributionsSum: number,
): GoalWithProgress {
  const current = goal.initialAmount + contributionsSum;
  const progress = goal.targetAmount > 0 ? current / goal.targetAmount : 0;
  let monthsRemaining: number | null = null;
  if (goal.targetDate) {
    monthsRemaining = differenceInCalendarMonths(
      parseISO(goal.targetDate),
      new Date(),
    );
  }
  const remaining = Math.max(0, goal.targetAmount - current);
  const suggestedMonthly =
    monthsRemaining !== null && monthsRemaining > 0
      ? remaining / monthsRemaining
      : null;
  return {
    ...goal,
    currentAmount: current,
    progress,
    monthsRemaining,
    suggestedMonthly,
    isCompleted: current >= goal.targetAmount,
  };
}

export function useGoals() {
  const { user } = useAuth();
  const { accountType } = useAccount();
  const queryClient = useQueryClient();
  const goalsKey = ['goals', user?.id, accountType];
  const contribKey = ['goalContributions', user?.id, accountType];

  const goalsCol = () =>
    collection(db, 'users', user!.id, 'accounts', accountType, 'goals');
  const contribCol = () =>
    collection(
      db,
      'users',
      user!.id,
      'accounts',
      accountType,
      'goalContributions',
    );

  const { data: rawGoals = [], isPending: goalsPending } = useQuery<Goal[]>({
    queryKey: goalsKey,
    queryFn: () => [],
    enabled: !!user,
    staleTime: Infinity,
  });

  const { data: contributions = [] } = useQuery<GoalContribution[]>({
    queryKey: contribKey,
    queryFn: () => [],
    enabled: !!user,
    staleTime: Infinity,
  });

  // Real-time: metas
  useEffect(() => {
    if (!user) return;
    const q = query(goalsCol(), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const goals = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          ...data,
          id: d.id,
          targetAmount: num(data.targetAmount),
          initialAmount: num(data.initialAmount),
        } as Goal;
      });
      queryClient.setQueryData(goalsKey, goals);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accountType, queryClient]);

  // Real-time: aportes
  useEffect(() => {
    if (!user) return;
    const q = query(contribCol(), orderBy('contributedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          ...data,
          id: d.id,
          amount: num(data.amount),
        } as GoalContribution;
      });
      queryClient.setQueryData(contribKey, items);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accountType, queryClient]);

  const contributionsByGoal = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of contributions) {
      map.set(c.goalId, (map.get(c.goalId) ?? 0) + c.amount);
    }
    return map;
  }, [contributions]);

  const goals: GoalWithProgress[] = useMemo(
    () =>
      rawGoals.map((g) =>
        computeProgress(g, contributionsByGoal.get(g.id) ?? 0),
      ),
    [rawGoals, contributionsByGoal],
  );

  // Auto-conclui metas ativas que bateram o alvo (backend não tem trigger).
  useEffect(() => {
    if (!user) return;
    const toClose = goals.filter((g) => g.status === 'active' && g.isCompleted);
    if (toClose.length === 0) return;
    void Promise.all(
      toClose.map((g) =>
        updateDoc(doc(goalsCol(), g.id), { status: 'completed' }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals]);

  const addMutation = useMutation({
    mutationFn: async (data: GoalFormValues) => {
      if (!user) throw new Error('Sessão expirou. Atualize a página.');
      return addDoc(
        goalsCol(),
        stripUndefined({
          ...data,
          status: 'active' as GoalStatus,
          createdAt: new Date().toISOString(),
        }),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<GoalFormValues>;
    }) => {
      if (!user) throw new Error('User not authenticated');
      return updateDoc(doc(goalsCol(), id), stripUndefined(data));
    },
  });

  const setStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: GoalStatus }) => {
      if (!user) throw new Error('User not authenticated');
      return updateDoc(doc(goalsCol(), id), { status });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      // Firestore não faz cascade: apaga os aportes vinculados primeiro.
      const linked = await getDocs(
        query(contribCol(), where('goalId', '==', id)),
      );
      await Promise.all(linked.docs.map((d) => deleteDoc(doc(contribCol(), d.id))));
      return deleteDoc(doc(goalsCol(), id));
    },
  });

  const addContributionMutation = useMutation({
    mutationFn: async (data: GoalContributionFormValues) => {
      if (!user) throw new Error('User not authenticated');
      return addDoc(
        contribCol(),
        stripUndefined({
          ...data,
          createdAt: new Date().toISOString(),
        }),
      );
    },
  });

  const deleteContributionMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      return deleteDoc(doc(contribCol(), id));
    },
  });

  return {
    goals,
    contributions,
    isLoading: goalsPending && user !== null,
    addGoal: addMutation.mutateAsync,
    updateGoal: updateMutation.mutateAsync,
    setGoalStatus: setStatusMutation.mutateAsync,
    deleteGoal: deleteMutation.mutateAsync,
    addContribution: addContributionMutation.mutateAsync,
    deleteContribution: deleteContributionMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isContributing: addContributionMutation.isPending,
  };
}
