import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCategories } from './useCategories';
import { CATEGORIES } from '@/lib/categories';

// Hoisted state we can mutate per test.
const authMock = vi.hoisted(() => ({
  user: null as { id: string; name: string } | null,
}));

const accountMock = vi.hoisted(() => ({
  accountId: null as string | null,
}));

interface CategoryRow {
  id: string;
  value: string;
  label: string;
  color: string;
}

const supabaseMock = vi.hoisted(() => ({
  rows: [] as CategoryRow[],
}));

vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: authMock.user }),
}));

vi.mock('./useAccount', () => ({
  useAccount: () => ({
    accountId: accountMock.accountId,
    accountType: 'personal' as const,
    setAccountType: () => {},
    isLoading: false,
  }),
}));

// Minimal in-memory supabase mock — supports the chain
// supabase.from('categories').select(...).eq(...).order(...)
// and a Realtime channel that immediately invokes nothing.
vi.mock('@/lib/supabase', () => {
  const builder = () => {
    const promise: any = Promise.resolve({
      data: supabaseMock.rows,
      error: null,
    });
    promise.eq = () => promise;
    promise.order = () => promise;
    promise.delete = () => promise;
    promise.insert = (row: any) => {
      supabaseMock.rows.push({ id: 'new', ...row });
      const inserted: any = Promise.resolve({ data: row, error: null });
      inserted.select = () => ({ single: () => Promise.resolve({ data: { id: 'new', ...row }, error: null }) });
      return inserted;
    };
    return promise;
  };

  return {
    supabase: {
      from: () => ({
        select: builder,
        delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
        insert: (row: any) => {
          supabaseMock.rows.push({ id: 'new', ...row });
          return {
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'new', ...row },
                  error: null,
                }),
            }),
          };
        },
      }),
      channel: () => ({
        on: function () {
          return this;
        },
        subscribe: () => 'subscribed',
      }),
      removeChannel: () => {},
    },
  };
});

describe('useCategories', () => {
  beforeEach(() => {
    authMock.user = null;
    accountMock.accountId = null;
    supabaseMock.rows = [];
    vi.clearAllMocks();
  });

  it('returns default categories when no user', async () => {
    const { result } = renderHook(() => useCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.categories.length).toBe(CATEGORIES.length);
  });

  it('merges defaults with custom categories from Supabase', async () => {
    authMock.user = { id: 'u1', name: 'Ana' };
    accountMock.accountId = 'acc-1';
    supabaseMock.rows = [
      { id: 'c1', value: 'freelance', label: 'Freelance', color: '#e11d48' },
    ];

    const { result } = renderHook(() => useCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));

    for (const def of CATEGORIES) {
      expect(
        result.current.categories.find((c) => c.value === def.value),
      ).toBeTruthy();
    }
    expect(
      result.current.categories.find((c) => c.value === 'freelance'),
    ).toBeTruthy();
  });

  it('preserves defaults on empty list', async () => {
    authMock.user = { id: 'u1', name: 'Ana' };
    accountMock.accountId = 'acc-1';
    supabaseMock.rows = [];

    const { result } = renderHook(() => useCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));

    for (const def of CATEGORIES) {
      expect(
        result.current.categories.find((c) => c.value === def.value),
      ).toBeTruthy();
    }
  });

  it('does not delete a default category', async () => {
    const { result } = renderHook(() => useCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const before = result.current.categories.length;
    await act(async () => {
      await result.current.deleteCategory('salario');
    });

    expect(
      result.current.categories.find((c) => c.value === 'salario'),
    ).toBeTruthy();
    expect(result.current.categories.length).toBe(before);
  });

  it('deletes a custom category locally', async () => {
    authMock.user = { id: 'u1', name: 'Ana' };
    accountMock.accountId = 'acc-1';
    supabaseMock.rows = [
      { id: 'cx', value: 'custom-test', label: 'Custom', color: '#111' },
    ];

    const { result } = renderHook(() => useCategories());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(
      result.current.categories.find((c) => c.value === 'custom-test'),
    ).toBeTruthy();

    await act(async () => {
      await result.current.deleteCategory('custom-test');
    });

    expect(
      result.current.categories.find((c) => c.value === 'custom-test'),
    ).toBeFalsy();
  });
});
