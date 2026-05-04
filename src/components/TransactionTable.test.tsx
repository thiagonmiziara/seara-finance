import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionTable } from './TransactionTable';
import { Transaction } from '@/types';

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [
      { value: 'compras', label: 'Compras', color: '#2563eb' },
      { value: 'salario', label: 'Salário', color: '#16a34a' },
      { value: 'transporte', label: 'Transporte', color: '#f59e0b' },
    ],
  }),
}));

const mockTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Aluguel',
    amount: 1500,
    category: 'compras',
    type: 'expense',
    status: 'pago',
    date: '2026-02-01',
    createdAt: '2026-02-02T10:00:00Z',
  },
  {
    id: '2',
    description: 'Salário',
    amount: 5000,
    category: 'salario',
    type: 'income',
    status: 'recebido',
    date: '2026-02-05',
    createdAt: '2026-02-06T09:00:00Z',
  },
  {
    id: '3',
    description: 'Internet',
    amount: 100,
    category: 'transporte',
    type: 'expense',
    status: 'a_pagar',
    date: '2026-02-10',
    createdAt: '2026-02-11T15:00:00Z',
  },
];

describe('TransactionTable', () => {
  it('renders table with transactions', () => {
    render(<TransactionTable data={mockTransactions} onDelete={() => {}} />);

    expect(screen.getAllByText('Aluguel').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Salário').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/R\$\s*1.500,00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/R\$\s*5.000,00/).length).toBeGreaterThan(0);
  });

  it('displays correct status labels and colors', () => {
    render(<TransactionTable data={mockTransactions} onDelete={() => {}} />);

    const pagoLabels = screen.getAllByText('Pago');
    const recebidoLabels = screen.getAllByText('Recebido');
    const aPagarLabels = screen.getAllByText('A Pagar');

    expect(
      pagoLabels.some(
        (el) =>
          el.classList.contains('text-emerald-800') ||
          el.classList.contains('text-emerald-500'),
      ),
    ).toBe(true);
    expect(
      recebidoLabels.some(
        (el) =>
          el.classList.contains('text-emerald-800') ||
          el.classList.contains('text-emerald-500'),
      ),
    ).toBe(true);
    expect(
      aPagarLabels.some(
        (el) =>
          el.classList.contains('text-red-800') ||
          el.classList.contains('text-red-400'),
      ),
    ).toBe(true);
  });

  it('shows transaction date and registration date', () => {
    render(<TransactionTable data={mockTransactions} onDelete={() => {}} />);

    // Transaction date for the first row (Situacao column)
    expect(screen.getAllByText('01/02/2026').length).toBeGreaterThan(0);

    // Registration date for the third row (Data column)
    expect(screen.getAllByText('11/02/2026').length).toBeGreaterThan(0);
  });

  it('opens confirmation dialog and calls onDelete when confirmed', async () => {
    const onDeleteMock = vi.fn();
    render(
      <TransactionTable data={mockTransactions} onDelete={onDeleteMock} />,
    );

    // Click the trash icon trigger (now opens a ConfirmDialog instead of deleting directly)
    const deleteTriggers = screen.getAllByRole('button', {
      name: /excluir transação/i,
    });
    fireEvent.click(deleteTriggers[0]);

    // The confirm button inside the dialog
    const confirmBtn = await screen.findByRole('button', { name: /^excluir$/i });
    fireEvent.click(confirmBtn);

    expect(onDeleteMock).toHaveBeenCalledWith('1');
  });

  it('shows empty state when no data is provided', () => {
    render(<TransactionTable data={[]} onDelete={() => {}} />);
    expect(screen.getByText('Sem resultados.')).toBeInTheDocument();
  });
});
