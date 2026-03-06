import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CardsView from './CardsView';
import * as useCardsHook from '@/hooks/useCards';
import * as useFinanceHook from '@/hooks/useFinance';
import * as useDebtsHook from '@/hooks/useDebts';
import type { DocumentData, DocumentReference } from 'firebase/firestore';

vi.mock('@/hooks/useCards');
vi.mock('@/hooks/useFinance');
vi.mock('@/hooks/useDebts');

describe('CardsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockedUseCards = vi.mocked(useCardsHook.useCards);
    const mockedUseFinance = vi.mocked(useFinanceHook.useFinance);
    const mockedUseDebts = vi.mocked(useDebtsHook.useDebts);
    mockedUseCards.mockReturnValue({
      cards: [],
      addCard: vi.fn(),
      deleteCard: vi.fn(),
      updateCard: vi.fn(),
      isAdding: false,
      isDeleting: false,
      isUpdating: false,
      isLoading: false,
    });
    mockedUseFinance.mockReturnValue({
      transactions: [],
      payInvoiceMonth: vi.fn(),
      isPayingInvoice: false,
      dashboardTransactions: [],
      allTransactions: [],
      addTransaction: vi.fn(async () => undefined),
      addTransfer: vi.fn(async () => undefined),
      removeTransaction: vi.fn(async () => undefined),
      exportToCSV: vi.fn(),
      summary: { income: 0, expense: 0, balance: 0 },
      isAdding: false,
      isDeleting: false,
      isInitialLoading: false,
      isLoading: false,
    });
    mockedUseDebts.mockReturnValue({
      debts: [],
      incrementInstallment: vi.fn(),
      addDebt: vi.fn(async () => ({} as DocumentReference<DocumentData>)),
      updateDebt: vi.fn(async () => undefined),
      removeDebt: vi.fn(async () => undefined),
      settleDebt: vi.fn(async () => undefined),
      summary: { total: 0, paid: 0, remaining: 0 },
      isAdding: false,
      isUpdating: false,
      isDeleting: false,
      isInitialLoading: false,
      isLoading: false,
    });
  });

  it('deve exibir mensagem quando não há cartões', () => {
    render(<CardsView />);
    expect(screen.getByText(/Nenhum cartão cadastrado/i)).toBeInTheDocument();
  });

  it('deve exibir o título principal', () => {
    render(<CardsView />);
    expect(
      screen.getByRole('heading', { name: /Cartões de Crédito/i }),
    ).toBeInTheDocument();
  });

  // Outros testes podem ser adicionados para cenários com cartões, dívidas, etc.
});
