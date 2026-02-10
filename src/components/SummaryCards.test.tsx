import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryCards } from './SummaryCards';

describe('SummaryCards', () => {
    const mockSummary = {
        income: 5000,
        expense: 2000,
        balance: 3000,
    };

    it('should render income, expense and balance correctly', () => {
        render(<SummaryCards summary={mockSummary} />);

        // Check values (formatted as currency in PT-BR)
        expect(screen.getByText(/R\$\s*5\.000,00/)).toBeInTheDocument();
        expect(screen.getByText(/R\$\s*2\.000,00/)).toBeInTheDocument();
        expect(screen.getByText(/R\$\s*3\.000,00/)).toBeInTheDocument();
    });

    it('should show red text for negative balance', () => {
        const negativeSummary = { ...mockSummary, balance: -500 };
        render(<SummaryCards summary={negativeSummary} />);

        const balanceElement = screen.getByText(/-R\$\s*500,00/);
        expect(balanceElement).toHaveClass('text-destructive');
    });

    it('should show green text for positive balance', () => {
        render(<SummaryCards summary={mockSummary} />);

        const balanceElement = screen.getByText(/R\$\s*3\.000,00/);
        expect(balanceElement).toHaveClass('text-primary');
    });
});
