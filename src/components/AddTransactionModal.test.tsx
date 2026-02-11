import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddTransactionModal } from "./AddTransactionModal";

describe("AddTransactionModal", () => {
    it("renders the trigger button", () => {
        render(<AddTransactionModal onAddTransaction={() => Promise.resolve()} />);
        expect(screen.getByText("Nova Transação")).toBeInTheDocument();
    });

    it("opens the modal on click", async () => {
        render(<AddTransactionModal onAddTransaction={() => Promise.resolve()} />);
        fireEvent.click(screen.getByText("Nova Transação"));

        expect(screen.getByText("Adicionar Transação")).toBeInTheDocument();
        expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
        expect(screen.getByLabelText("Valor")).toBeInTheDocument();
    });

    it("calls onAddTransaction with form data on valid submission", async () => {
        const onAddTransactionMock = vi.fn().mockResolvedValue({});
        render(<AddTransactionModal onAddTransaction={onAddTransactionMock} />);

        // Open modal
        fireEvent.click(screen.getByText("Nova Transação"));

        // Fill form
        fireEvent.change(screen.getByLabelText("Descrição"), { target: { value: "Mercado" } });
        fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "150.50" } });
        fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: "Alimentação" } });

        // Submit
        fireEvent.click(screen.getByText("Salvar"));

        await waitFor(() => {
            expect(onAddTransactionMock).toHaveBeenCalled();
            const calledData = onAddTransactionMock.mock.calls[0][0];
            expect(calledData.description).toBe("Mercado");
            expect(calledData.amount).toBe(150.5);
            expect(calledData.category).toBe("Alimentação");
        });
    });

    it("shows validation errors on empty submission", async () => {
        render(<AddTransactionModal onAddTransaction={() => Promise.resolve()} />);

        // Open modal
        fireEvent.click(screen.getByText("Nova Transação"));

        // Fill partial data (amount 0)
        fireEvent.change(screen.getByLabelText("Valor"), { target: { value: "0" } });

        // Submit
        fireEvent.click(screen.getByText("Salvar"));

        await waitFor(() => {
            // Check for descriptive error message if possible, or just text
            expect(screen.getByText(/Valor deve ser maior que zero/i)).toBeInTheDocument();
        });
    });
});
