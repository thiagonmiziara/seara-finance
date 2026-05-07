import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountProvider, useAccount } from './useAccount';

vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ error: null }),
    }),
  },
}));

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <AccountProvider>{children}</AccountProvider>
    </QueryClientProvider>
  );
}

describe('useAccount', () => {
  beforeEach(() => {
    localStorage.removeItem('sf:accountType');
    localStorage.removeItem('seara:accountType');
  });

  it('defaults to personal', () => {
    const { result } = renderHook(() => useAccount(), { wrapper: makeWrapper() });
    expect(result.current.accountType).toBe('personal');
  });

  it('updates account type and persists to localStorage', () => {
    const { result } = renderHook(() => useAccount(), { wrapper: makeWrapper() });
    act(() => {
      result.current.setAccountType('business');
    });
    expect(result.current.accountType).toBe('business');
    expect(localStorage.getItem('sf:accountType')).toBe('business');
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useAccount())).toThrow(
      'useAccount must be used within an AccountProvider',
    );
  });
});
