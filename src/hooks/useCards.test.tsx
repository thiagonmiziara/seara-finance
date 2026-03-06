import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCards } from './useCards';

vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('./useAccount', () => ({
  useAccount: () => ({ accountType: 'personal' }),
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

describe('useCards', () => {
  it('returns empty cards when no user', () => {
    const { result } = renderHook(() => useCards(), {
      wrapper: createWrapper(),
    });
    expect(result.current.cards).toEqual([]);
  });
});
