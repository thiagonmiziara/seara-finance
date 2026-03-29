import { useMemo } from 'react';
import { CreditCard } from '@/types';

export type StatusCategory = 'Saudável' | 'Atenção' | 'Risco' | 'Estourado';

export interface CardUsageData {
  card: CreditCard;
  usedLimit: number;
}

export interface CardScoreResult {
  cardId: string;
  score: number;
  weight: number;
  status: StatusCategory;
}

export interface SmartCreditScoreResult {
  cardScores: Record<string, CardScoreResult>;
  globalScore: number;
  globalStatus: StatusCategory;
}

export const getStatusCategory = (score: number): StatusCategory => {
  if (score <= 50) return 'Saudável';
  if (score <= 80) return 'Atenção';
  if (score <= 100) return 'Risco';
  return 'Estourado';
};

export const getStatusColor = (status: StatusCategory): string => {
  switch (status) {
    case 'Saudável':
      return 'bg-emerald-500';
    case 'Atenção':
      return 'bg-yellow-500';
    case 'Risco':
      return 'bg-orange-500';
    case 'Estourado':
      return 'bg-red-500';
    default:
      return 'bg-primary';
  }
};

export function useSmartCreditScore(cardsData: CardUsageData[]): SmartCreditScoreResult {
  return useMemo(() => {
    let totalScoreSum = 0;
    let totalWeightSum = 0;
    const cardScores: Record<string, CardScoreResult> = {};

    cardsData.forEach(({ card, usedLimit }) => {
      let score = 0;
      let weight = 0;

      if (card.limit_user_defined && card.limit_user_defined > 0) {
        score = (usedLimit / card.limit_user_defined) * 100;
        weight = 1.0;
      } else {
        // Individual score visual is exactly the percentage used of the bank limit.
        score = (usedLimit / card.limit) * 100;
        // In the global context, it has less weight because it lacks user planning.
        weight = 0.7;
      }

      cardScores[card.id] = {
        cardId: card.id,
        score,
        weight,
        status: getStatusCategory(score),
      };

      totalScoreSum += score * weight;
      totalWeightSum += weight;
    });

    const globalScore = totalWeightSum > 0 ? totalScoreSum / totalWeightSum : 0;
    const globalStatus = getStatusCategory(globalScore);

    return {
      cardScores,
      globalScore,
      globalStatus,
    };
  }, [cardsData]);
}
