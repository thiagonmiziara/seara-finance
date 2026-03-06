import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DebtsView from './DebtsView';
import * as useDebtsHook from '@/hooks/useDebts';

vi.mock('@/hooks/useDebts');

describe('DebtsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockedUseDebts = vi.mocked(useDebtsHook.useDebts);
    mockedUseDebts.mockReturnValue({
      debts: [],
      addDebt: vi.fn(),
      removeDebt: vi.fn(),
      incrementInstallment: vi.fn(),
      settleDebt: vi.fn(),
      summary: { total: 0, remaining: 0, paid: 0 },
      isAdding: false,
      isDeleting: false,
      isInitialLoading: false,
      updateDebt: vi.fn(async () => undefined),
      isUpdating: false,
      isLoading: false,
    });
  });

  it('deve exibir o título principal', () => {
    render(<DebtsView />);
    expect(
      screen.getByRole('heading', { name: /^Dívidas$/i }),
    ).toBeInTheDocument();
  });

  it('deve exibir "Total em Dívidas" com valor inicial', () => {
    render(<DebtsView />);
    expect(screen.getByText(/Total em Dívidas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s?0,00/).length).toBeGreaterThan(0);
  });

  // Outros testes podem ser adicionados para cenários com dívidas, carregamento, etc.
});
