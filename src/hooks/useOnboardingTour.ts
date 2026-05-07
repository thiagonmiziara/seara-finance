import { useState, useCallback, useEffect } from 'react';
import { STATUS, EVENTS, ACTIONS } from 'react-joyride';

export interface TourStep {
  target: string;       // data-tour="step-X" selector
  title: string;
  description: string;
  icon: string;
  tab?: 'overview' | 'debts' | 'cards';  // auto-switch tab
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'step-1',
    title: 'Seu Resumo',
    description: 'Aqui você vê saldo, receitas e despesas do período selecionado.',
    icon: '💰',
    tab: 'overview',
  },
  {
    target: 'step-2',
    title: 'Insights Inteligentes',
    description: 'Acompanhe sua Saúde Financeira e veja o impacto das parcelas no limite do cartão.',
    icon: '💡',
    tab: 'overview',
  },
  {
    target: 'step-3',
    title: 'Período',
    description: 'Filtre por mês atual, anterior ou escolha datas personalizadas.',
    icon: '📅',
    tab: 'overview',
  },
  {
    target: 'step-4',
    title: 'Nova Transação',
    description: 'Adicione receitas, despesas ou transferências entre contas.',
    icon: '➕',
    tab: 'overview',
  },
  {
    target: 'step-5',
    title: 'Dívidas',
    description: 'Acompanhe todas as suas dívidas e parcelas em andamento.',
    icon: '📋',
    tab: 'debts',
  },
  {
    target: 'step-6',
    title: 'Cartões',
    description: 'Gerencie seus cartões, limites e veja a previsão de fatura.',
    icon: '💳',
    tab: 'cards',
  },
  {
    target: 'step-7',
    title: 'Contas',
    description: 'Alterne entre conta pessoal e empresarial a qualquer momento.',
    icon: '🔄',
    tab: 'overview',
  },
];

const STORAGE_KEY = 'finzap-tour-completed';

export function useOnboardingTour(onTabChange?: (tab: 'overview' | 'debts' | 'cards') => void) {
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(false);

  // Auto-start on first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay so the Dashboard is fully rendered
      const timer = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setRun(true);
  }, []);

  const handleJoyrideCallback = useCallback((data: any) => {
    const { action, index, status, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      // Tour completed or skipped
      localStorage.setItem(STORAGE_KEY, 'true');
      setRun(false);
      setStepIndex(0);
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Update state to advance the tour
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if (type === EVENTS.STEP_BEFORE) {
      // Handle tab switching before the step targets an element
      const nextStep = TOUR_STEPS[index];
      if (nextStep && nextStep.tab && onTabChange) {
        onTabChange(nextStep.tab);
      }
    }
  }, [onTabChange]);

  return {
    run,
    stepIndex,
    steps: TOUR_STEPS,
    start,
    handleJoyrideCallback,
  };
}
