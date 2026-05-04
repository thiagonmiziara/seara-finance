import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import DebtsView from './DebtsView';
import * as useDebtsHook from '@/hooks/useDebts';
import * as useCardsHook from '@/hooks/useCards';

vi.mock('@/hooks/useDebts');
vi.mock('@/hooks/useCards');

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
    const mockedUseCards = vi.mocked(useCardsHook.useCards);
    mockedUseCards.mockReturnValue({
      cards: [],
      addCard: vi.fn(),
      updateCard: vi.fn(),
      removeCard: vi.fn(),
      isAdding: false,
      isUpdating: false,
      isDeleting: false,
      isInitialLoading: false,
      isLoading: false,
    } as any);
  });

  it('deve exibir o título principal', () => {
    render(<DebtsView />);
    expect(
      screen.getByRole('heading', { name: /^Dívidas$/i }),
    ).toBeInTheDocument();
  });

  it('deve exibir os KPIs principais com valor inicial', () => {
    render(<DebtsView />);
    expect(screen.getByText(/Total contratado/i)).toBeInTheDocument();
    expect(screen.getByText(/Restante a pagar/i)).toBeInTheDocument();
    expect(screen.getByText(/Já quitado/i)).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s?0,00/).length).toBeGreaterThan(0);
  });

  it('deve mostrar empty state quando não há dívidas', () => {
    render(<DebtsView />);
    expect(screen.getByText(/Sem dívidas cadastradas/i)).toBeInTheDocument();
  });
});
