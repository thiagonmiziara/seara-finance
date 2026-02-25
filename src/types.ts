import { z } from 'zod';

export const transactionSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['income', 'expense']),
  status: z.enum(['pago', 'a_pagar', 'recebido', 'a_receber']),
  date: z.string(), // Transaction date (ISO string)
  createdAt: z.string(), // Registration date (ISO string)
});

export type Transaction = z.infer<typeof transactionSchema>;

export const transactionFormSchema = transactionSchema
  .omit({ id: true, createdAt: true })
  .refine((data) => data.category !== 'criar_categoria', {
    message:
      'Selecione uma categoria ou clique em Criar para adicionar a nova categoria antes de salvar.',
    path: ['category'],
  });
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

export const debtSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  totalAmount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  installments: z.number().min(1, 'Deve ter ao menos 1 parcela'),
  installmentAmount: z.number().min(0, 'Valor da parcela não pode ser negativo'),
  paidInstallments: z.number().int().nonnegative().optional(),
  status: z.enum(['a_pagar', 'pago']),
  dueDate: z.string(), // ISO string
  createdAt: z.string(), // ISO string
});

export type Debt = z.infer<typeof debtSchema>;

export const debtFormSchema = debtSchema.omit({ id: true, createdAt: true });
export type DebtFormValues = z.infer<typeof debtFormSchema>;
