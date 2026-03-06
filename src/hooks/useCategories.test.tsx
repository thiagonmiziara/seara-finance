import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCategories } from './useCategories';
import { CATEGORIES } from '@/lib/categories';

vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('./useAccount', () => ({
  useAccount: () => ({ accountType: 'personal' }),
}));

describe('useCategories', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default categories when no user', async () => {
    const { result } = renderHook(() => useCategories());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.categories.length).toBe(CATEGORIES.length);
  });
});
