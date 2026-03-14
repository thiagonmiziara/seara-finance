import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCategories } from './useCategories';
import { CATEGORIES } from '@/lib/categories';

// Hoist mocks so we can change auth/account per test
const authMock = vi.hoisted(() => ({
  user: null as { id: string; name: string } | null,
}));

const accountMock = vi.hoisted(() => ({
  accountType: 'personal' as string,
}));

const firestoreMocks = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
}));

vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: authMock.user }),
}));

vi.mock('./useAccount', () => ({
  useAccount: () => ({ accountType: accountMock.accountType }),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: firestoreMocks.collection,
  addDoc: firestoreMocks.addDoc,
  onSnapshot: firestoreMocks.onSnapshot,
  query: firestoreMocks.query,
  orderBy: firestoreMocks.orderBy,
  where: firestoreMocks.where,
  getDocs: firestoreMocks.getDocs,
  deleteDoc: vi.fn(),
}));

function makeSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    empty: docs.length === 0,
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
    })),
  };
}

describe('useCategories', () => {
  beforeEach(() => {
    localStorage.clear();
    authMock.user = null;
    accountMock.accountType = 'personal';
    vi.clearAllMocks();

    firestoreMocks.collection.mockReturnValue('col-ref');
    firestoreMocks.query.mockReturnValue('query-ref');
    firestoreMocks.orderBy.mockReturnValue('order-ref');
    firestoreMocks.where.mockReturnValue('where-ref');
  });

  it('returns default categories when no user', async () => {
    const { result } = renderHook(() => useCategories());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.categories.length).toBe(CATEGORIES.length);
  });

  it('merges defaults with Firestore custom categories on non-empty snapshot', async () => {
    authMock.user = { id: 'u1', name: 'Test' };
    const customCat = {
      value: 'freelance',
      label: 'Freelance',
      color: '#e11d48',
    };

    firestoreMocks.onSnapshot.mockImplementation(
      (_q: unknown, cb: (snap: ReturnType<typeof makeSnap>) => void) => {
        cb(makeSnap([{ id: 'doc1', data: customCat }]));
        return () => {};
      },
    );

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // All defaults must be present
    for (const def of CATEGORIES) {
      expect(
        result.current.categories.find((c) => c.value === def.value),
      ).toBeTruthy();
    }
    // Custom category must also be present
    expect(
      result.current.categories.find((c) => c.value === 'freelance'),
    ).toBeTruthy();
    // Total = defaults + 1 custom
    expect(result.current.categories.length).toBe(CATEGORIES.length + 1);
  });

  it('preserves defaults on empty snapshot', async () => {
    authMock.user = { id: 'u1', name: 'Test' };

    firestoreMocks.onSnapshot.mockImplementation(
      (_q: unknown, cb: (snap: ReturnType<typeof makeSnap>) => void) => {
        cb(makeSnap([]));
        return () => {};
      },
    );

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.categories.length).toBeGreaterThanOrEqual(
      CATEGORIES.length,
    );
    for (const def of CATEGORIES) {
      expect(
        result.current.categories.find((c) => c.value === def.value),
      ).toBeTruthy();
    }
  });

  it('does not delete a default category', async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const before = result.current.categories.length;

    await act(async () => {
      await result.current.deleteCategory('salario');
    });

    // salario is a default — it must still be present
    expect(
      result.current.categories.find((c) => c.value === 'salario'),
    ).toBeTruthy();
    expect(result.current.categories.length).toBe(before);
  });

  it('deletes a custom category normally', async () => {
    authMock.user = { id: 'u1', name: 'Test' };
    const customCat = {
      value: 'custom-test',
      label: 'Custom Test',
      color: '#111',
    };

    firestoreMocks.onSnapshot.mockImplementation(
      (_q: unknown, cb: (snap: ReturnType<typeof makeSnap>) => void) => {
        cb(makeSnap([{ id: 'doc-custom', data: customCat }]));
        return () => {};
      },
    );

    // getDocs returns the doc so deleteDoc path runs
    firestoreMocks.getDocs.mockResolvedValue({
      empty: false,
      docs: [
        { id: 'doc-custom', data: () => customCat, ref: { id: 'doc-custom' } },
      ],
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(
      result.current.categories.find((c) => c.value === 'custom-test'),
    ).toBeTruthy();

    await act(async () => {
      await result.current.deleteCategory('custom-test');
    });

    expect(
      result.current.categories.find((c) => c.value === 'custom-test'),
    ).toBeFalsy();
    // Defaults must still be present
    for (const def of CATEGORIES) {
      expect(
        result.current.categories.find((c) => c.value === def.value),
      ).toBeTruthy();
    }
  });

  it('preserves defaults when accountType changes', async () => {
    authMock.user = { id: 'u1', name: 'Test' };

    const personalCat = {
      value: 'personal-cat',
      label: 'Personal',
      color: '#aaa',
    };
    const businessCat = {
      value: 'business-cat',
      label: 'Business',
      color: '#bbb',
    };

    // onSnapshot returns different data depending on call order
    let callCount = 0;
    firestoreMocks.onSnapshot.mockImplementation(
      (_q: unknown, cb: (snap: ReturnType<typeof makeSnap>) => void) => {
        callCount++;
        if (callCount === 1) {
          cb(makeSnap([{ id: 'p1', data: personalCat }]));
        } else {
          cb(makeSnap([{ id: 'b1', data: businessCat }]));
        }
        return () => {};
      },
    );

    const { result, rerender } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Personal account: defaults + personalCat
    for (const def of CATEGORIES) {
      expect(
        result.current.categories.find((c) => c.value === def.value),
      ).toBeTruthy();
    }
    expect(
      result.current.categories.find((c) => c.value === 'personal-cat'),
    ).toBeTruthy();

    // Switch to business
    accountMock.accountType = 'business';
    rerender();

    await waitFor(() => {
      expect(
        result.current.categories.find((c) => c.value === 'business-cat'),
      ).toBeTruthy();
    });

    // Defaults must still be present after account switch
    for (const def of CATEGORIES) {
      expect(
        result.current.categories.find((c) => c.value === def.value),
      ).toBeTruthy();
    }
  });
});
