import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditCardLimitModal } from './EditCardLimitModal';
import type { CreditCard } from '@/types';
import type { ComponentProps } from 'react';

vi.mock('@/lib/cardBrand', () => ({
  detectCardBrand: vi.fn(() => 'visa'),
  formatCardNumber: vi.fn((value: string) => value),
  maxCardDigits: vi.fn(() => 16),
}));

describe('EditCardLimitModal', () => {
  const card: CreditCard = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Cartao Teste',
    limit: 5000,
    closingDay: 10,
    dueDay: 20,
    color: '#000000',
    brand: 'visa',
    lastFour: '1234',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  let onUpdateLimit: ComponentProps<typeof EditCardLimitModal>['onUpdateLimit'];

  beforeEach(() => {
    onUpdateLimit = vi.fn().mockResolvedValue(undefined) as ComponentProps<
      typeof EditCardLimitModal
    >['onUpdateLimit'];
  });

  it('abre o modal ao clicar no botao de editar', () => {
    render(<EditCardLimitModal card={card} onUpdateLimit={onUpdateLimit} />);
    fireEvent.click(screen.getByTitle('Editar cartão'));
    expect(screen.getByText('Editar Cartão')).toBeInTheDocument();
  });

  it('submete com novo limite', async () => {
    render(<EditCardLimitModal card={card} onUpdateLimit={onUpdateLimit} />);
    fireEvent.click(screen.getByTitle('Editar cartão'));

    const input = screen.getByLabelText('Limite Total');
    fireEvent.change(input, { target: { value: '10000' } });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(onUpdateLimit).toHaveBeenCalledWith({
        id: card.id,
        data: {
          limit: 100,
          brand: 'visa',
          lastFour: '1234',
        },
      });
    });
  });
});
