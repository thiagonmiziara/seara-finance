import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to dark and applies class', async () => {
    const { result } = renderHook(() => useTheme());
    await waitFor(() => {
      expect(result.current.theme).toBe('dark');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles to light and removes dark class', async () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    await waitFor(() => {
      expect(result.current.theme).toBe('light');
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
