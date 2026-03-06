import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CardsView from './CardsView';
import * as useCardsHook from '@/hooks/useCards';
import * as useFinanceHook from '@/hooks/useFinance';
import * as useDebtsHook from '@/hooks/useDebts';
import { TransactionFormValues } from '@/types';
import { MutateOptions } from '@tanstack/react-query';
import { DocumentReference, DocumentData } from 'firebase/firestore';
import { DebtFormValues } from '@/types';
import { MutateOptions } from '@tanstack/react-query';
import { DocumentReference, DocumentData } from 'firebase/firestore';

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
      addTransaction: function (
        variables: {
          type: 'income' | 'expense';
          status: 'pago' | 'a_pagar' | 'recebido' | 'a_receber';
          description: string;
          amount: number;
          category: string;
          date: string;
          cardId?: string | undefined;
          installmentsTotal?: number | undefined;
        },
        options?:
          | MutateOptions<
              DocumentReference<DocumentData, DocumentData> | undefined,
              Error,
              {
                type: 'income' | 'expense';
                status: 'pago' | 'a_pagar' | 'recebido' | 'a_receber';
                description: string;
                amount: number;
                category: string;
                date: string;
                cardId?: string | undefined;
                installmentsTotal?: number | undefined;
              },
              {
                previousTransactions:
                  | {
                      type: 'income' | 'expense';
                      id: string;
                      createdAt: string;
                      status: 'pago' | 'a_pagar' | 'recebido' | 'a_receber';
                      description: string;
                      amount: number;
                      category: string;
                      date: string;
                      cardId?: string | undefined;
                      installments?:
                        | { current: number; total: number }
                        | undefined;
                    }[]
                  | undefined;
              }
            >
          | undefined,
      ): Promise<DocumentReference<DocumentData, DocumentData> | undefined> {
        throw new Error('Function not implemented.');
      },
      addTransfer: function (
        variables: {
          sourceData: TransactionFormValues;
          destinationData: TransactionFormValues;
          destinationAccountType: string;
        },
        options?:
          | MutateOptions<
              void,
              Error,
              {
                sourceData: TransactionFormValues;
                destinationData: TransactionFormValues;
                destinationAccountType: string;
              },
              unknown
            >
          | undefined,
      ): Promise<void> {
        throw new Error('Function not implemented.');
      },
      removeTransaction: function (
        variables: string,
        options?:
          | MutateOptions<
              void,
              Error,
              string,
              {
                previousTransactions:
                  | {
                      type: 'income' | 'expense';
                      id: string;
                      createdAt: string;
                      status: 'pago' | 'a_pagar' | 'recebido' | 'a_receber';
                      description: string;
                      amount: number;
                      category: string;
                      date: string;
                      cardId?: string | undefined;
                      installments?:
                        | { current: number; total: number }
                        | undefined;
                    }[]
                  | undefined;
              }
            >
          | undefined,
      ): Promise<void> {
        throw new Error('Function not implemented.');
      },
      exportToCSV: undefined,
      summary: undefined,
      isAdding: false,
      isDeleting: false,
      isInitialLoading: false,
      isLoading: false,
    });
    mockedUseDebts.mockReturnValue({
      debts: [],
      incrementInstallment: vi.fn(),
      addDebt: function (
        variables: {
          status: 'pago' | 'a_pagar';
          description: string;
          installments: number;
          totalAmount: number;
          installmentAmount: number;
          dueDate: string;
          cardId?: string | undefined;
          paidInstallments?: number | undefined;
        },
        options?:
          | MutateOptions<
              DocumentReference<DocumentData, DocumentData>,
              Error,
              {
                status: 'pago' | 'a_pagar';
                description: string;
                installments: number;
                totalAmount: number;
                installmentAmount: number;
                dueDate: string;
                cardId?: string | undefined;
                paidInstallments?: number | undefined;
              },
              {
                previousDebts:
                  | {
                      id: string;
                      createdAt: string;
                      status: 'pago' | 'a_pagar';
                      description: string;
                      installments: number;
                      totalAmount: number;
                      installmentAmount: number;
                      dueDate: string;
                      cardId?: string | undefined;
                      paidInstallments?: number | undefined;
                    }[]
                  | undefined;
              }
            >
          | undefined,
      ): Promise<DocumentReference<DocumentData, DocumentData>> {
        throw new Error('Function not implemented.');
      },
      updateDebt: function (
        variables: { id: string; data: Partial<DebtFormValues> },
        options?:
          | MutateOptions<
              void,
              Error,
              { id: string; data: Partial<DebtFormValues> },
              {
                previousDebts:
                  | {
                      id: string;
                      createdAt: string;
                      status: 'pago' | 'a_pagar';
                      description: string;
                      installments: number;
                      totalAmount: number;
                      installmentAmount: number;
                      dueDate: string;
                      cardId?: string | undefined;
                      paidInstallments?: number | undefined;
                    }[]
                  | undefined;
              }
            >
          | undefined,
      ): Promise<void> {
        throw new Error('Function not implemented.');
      },
      removeDebt: function (
        variables: string,
        options?:
          | MutateOptions<
              void,
              Error,
              string,
              {
                previousDebts:
                  | {
                      id: string;
                      createdAt: string;
                      status: 'pago' | 'a_pagar';
                      description: string;
                      installments: number;
                      totalAmount: number;
                      installmentAmount: number;
                      dueDate: string;
                      cardId?: string | undefined;
                      paidInstallments?: number | undefined;
                    }[]
                  | undefined;
              }
            >
          | undefined,
      ): Promise<void> {
        throw new Error('Function not implemented.');
      },
      settleDebt: undefined,
      summary: undefined,
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
