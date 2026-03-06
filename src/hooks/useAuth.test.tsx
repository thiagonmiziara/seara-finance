import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';

const authMocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: authMocks.signInWithPopup,
  signOut: authMocks.signOut,
  onAuthStateChanged: authMocks.onAuthStateChanged,
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    authMocks.onAuthStateChanged.mockReset();
    authMocks.signInWithPopup.mockReset();
    authMocks.signOut.mockReset();
  });

  it('sets user when auth state changes', () => {
    authMocks.onAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      cb({
        uid: 'user-1',
        displayName: 'Ana',
        email: 'ana@example.com',
        photoURL: 'http://avatar',
      });
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user?.name).toBe('Ana');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('calls signInWithPopup on login', async () => {
    authMocks.onAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      cb(null);
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login();
    });

    expect(authMocks.signInWithPopup).toHaveBeenCalled();
  });
});
