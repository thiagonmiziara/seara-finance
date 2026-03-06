import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DebtProgressChart } from './DebtProgressChart';

describe('DebtProgressChart', () => {
  it('deve exibir mensagem de ausência de dados quando não há dívidas', () => {
    render(<DebtProgressChart debts={[]} />);
    expect(screen.getByText(/Sem dados para exibir/i)).toBeInTheDocument();
  });

  it('deve exibir o título "Top 5 Dívidas"', () => {
    render(<DebtProgressChart debts={[]} />);
    expect(screen.getByText(/Top 5 Dívidas/i)).toBeInTheDocument();
  });

  // Outros testes podem ser adicionados para cenários com dívidas
});
