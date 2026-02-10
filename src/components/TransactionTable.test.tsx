import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TransactionTable } from "./TransactionTable";
import { Transaction } from "@/types";

const mockTransactions: Transaction[] = [
    {
        id: "1",
        description: "Aluguel",
        amount: 1500,
        category: "Habitação",
        type: "expense",
        status: "pago",
        date: "2026-02-01",
        createdAt: "2026-02-02T10:00:00Z",
    },
    {
        id: "2",
        description: "Salário",
        amount: 5000,
        category: "Trabalho",
        type: "income",
        status: "recebido",
        date: "2026-02-05",
        createdAt: "2026-02-06T09:00:00Z",
    },
    {
        id: "3",
        description: "Internet",
        amount: 100,
        category: "Serviços",
        type: "expense",
        status: "a_pagar",
        date: "2026-02-10",
        createdAt: "2026-02-11T15:00:00Z",
    },
];

describe("TransactionTable", () => {
    it("renders table with transactions", () => {
        render(<TransactionTable data={mockTransactions} onDelete={() => { }} />);

        expect(screen.getByText("Aluguel")).toBeInTheDocument();
        expect(screen.getByText("Salário")).toBeInTheDocument();
        expect(screen.getByText(/R\$\s*1.500,00/)).toBeInTheDocument();
        expect(screen.getByText(/R\$\s*5.000,00/)).toBeInTheDocument();
    });

    it("displays correct status labels and colors", () => {
        render(<TransactionTable data={mockTransactions} onDelete={() => { }} />);

        const pagoLabel = screen.getByText("Pago");
        const recebidoLabel = screen.getByText("Recebido");
        const aPagarLabel = screen.getByText("A Pagar");

        expect(pagoLabel).toHaveClass("text-primary");
        expect(recebidoLabel).toHaveClass("text-primary");
        expect(aPagarLabel).toHaveClass("text-destructive");
        expect(aPagarLabel).toHaveClass("font-bold");
    });

    it("shows transaction date and registration date", () => {
        render(<TransactionTable data={mockTransactions} onDelete={() => { }} />);

        // Transaction date for the first row (Situacao column)
        expect(screen.getByText("01/02/2026")).toBeInTheDocument();

        // Registration date for the third row (Data column)
        expect(screen.getByText("11/02/2026")).toBeInTheDocument();
    });

    it("calls onDelete when delete button is clicked", () => {
        const onDeleteMock = vi.fn();
        render(<TransactionTable data={mockTransactions} onDelete={onDeleteMock} />);

        const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
        fireEvent.click(deleteButtons[0]);

        expect(onDeleteMock).toHaveBeenCalledWith("1");
    });

    it("shows empty state when no data is provided", () => {
        render(<TransactionTable data={[]} onDelete={() => { }} />);
        expect(screen.getByText("Sem resultados.")).toBeInTheDocument();
    });
});
