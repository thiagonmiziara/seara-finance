import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AccountProvider, useAccount } from './useAccount';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AccountProvider>{children}</AccountProvider>
);

describe('useAccount', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to personal', () => {
    const { result } = renderHook(() => useAccount(), { wrapper });
    expect(result.current.accountType).toBe('personal');
  });

  it('updates account type and persists to localStorage', () => {
    const { result } = renderHook(() => useAccount(), { wrapper });
    act(() => {
      result.current.setAccountType('business');
    });
    expect(result.current.accountType).toBe('business');
    expect(localStorage.getItem('seara:accountType')).toBe('business');
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useAccount())).toThrow(
      'useAccount must be used within an AccountProvider',
    );
  });
});
