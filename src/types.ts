import { z } from "zod";

export const transactionSchema = z.object({
    id: z.string().uuid(),
    description: z.string().min(1, "Descrição é obrigatória"),
    amount: z.number().min(0.01, "Valor deve ser maior que zero"),
    category: z.string().min(1, "Categoria é obrigatória"),
    type: z.enum(["income", "expense"]),
    status: z.enum(["pago", "a_receber"]),
    date: z.string(), // Transaction date (ISO string)
    createdAt: z.string(), // Registration date (ISO string)
});

export type Transaction = z.infer<typeof transactionSchema>;

export const transactionFormSchema = transactionSchema.omit({ id: true, createdAt: true });
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export interface FinanceContextType {
    transactions: Transaction[];
    addTransaction: (data: TransactionFormValues) => void;
    removeTransaction: (id: string) => void;
    exportToCSV: () => void;
    summary: {
        income: number;
        expense: number;
        balance: number;
    };
}
