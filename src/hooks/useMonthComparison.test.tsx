import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMonthComparison } from './useMonthComparison';
import type { Transaction } from '@/types';

describe('useMonthComparison', () => {
  it('computes total comparison between months', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        description: 'Alimentacao',
        amount: 100,
        category: 'alimentacao',
        type: 'expense',
        status: 'pago',
        date: '2024-01-15T00:00:00.000Z',
        createdAt: '2024-01-15T00:00:00.000Z',
      },
      {
        id: '2',
        description: 'Transporte',
        amount: 50,
        category: 'transporte',
        type: 'expense',
        status: 'pago',
        date: '2024-02-20T00:00:00.000Z',
        createdAt: '2024-02-20T00:00:00.000Z',
      },
    ];

    const { result } = renderHook(() => useMonthComparison(transactions));
    const comparison = result.current.getComparison(
      new Date('2024-01-15T00:00:00.000Z'),
      new Date('2024-02-15T00:00:00.000Z'),
      'total',
      'expense',
    );

    expect(comparison.monthA).toBe(100);
    expect(comparison.monthB).toBe(50);
    expect(comparison.difference).toBe(50);
    expect(comparison.percentChange).toBe(100);
  });
});
