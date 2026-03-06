import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useMigration } from './useMigration';

vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

describe('useMigration', () => {
  it('returns not migrating when no user', () => {
    const { result } = renderHook(() => useMigration());
    expect(result.current.isMigrating).toBe(false);
  });
});
