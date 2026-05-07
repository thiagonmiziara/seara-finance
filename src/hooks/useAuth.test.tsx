import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from './useAuth';

const authMocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: authMocks.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: authMocks.createUserWithEmailAndPassword,
  sendPasswordResetEmail: authMocks.sendPasswordResetEmail,
  updateProfile: authMocks.updateProfile,
  signOut: authMocks.signOut,
  onAuthStateChanged: authMocks.onAuthStateChanged,
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

vi.mock('@/lib/users', () => ({
  syncUserToSupabase: vi.fn(() => Promise.resolve()),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    Object.values(authMocks).forEach((m) => m.mockReset());
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

  it('calls signInWithEmailAndPassword on login', async () => {
    authMocks.onAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      cb(null);
      return () => {};
    });
    authMocks.signInWithEmailAndPassword.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('user@example.com', 'secret123');
    });

    expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'user@example.com',
      'secret123',
    );
  });

  it('calls createUserWithEmailAndPassword + updateProfile on signup', async () => {
    authMocks.onAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      cb(null);
      return () => {};
    });
    authMocks.createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'user-1' },
    });
    authMocks.updateProfile.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.signup('new@example.com', 'secret123', 'Ana');
    });

    expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'new@example.com',
      'secret123',
    );
    expect(authMocks.updateProfile).toHaveBeenCalled();
  });

  it('exposes resetPassword that calls sendPasswordResetEmail', async () => {
    authMocks.onAuthStateChanged.mockImplementation((_auth: any, cb: any) => {
      cb(null);
      return () => {};
    });
    authMocks.sendPasswordResetEmail.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.resetPassword('user@example.com');
    });

    expect(authMocks.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      'user@example.com',
    );
  });
});
