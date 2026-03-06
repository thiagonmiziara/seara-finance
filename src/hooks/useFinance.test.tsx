import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFinance } from './useFinance';

vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('./useAccount', () => ({
  useAccount: () => ({ accountType: 'personal' }),
}));

vi.mock('./useCategories', () => ({
  useCategories: () => ({ categories: [] }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFinance', () => {
  it('returns empty transactions when no user', () => {
    const { result } = renderHook(() => useFinance(), {
      wrapper: createWrapper(),
    });
    expect(result.current.transactions).toEqual([]);
  });
});
