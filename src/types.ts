import { z } from 'zod';

export const transactionSchema = z.object({
  id: z.string().uuid(),
  description: z
    .string({
      required_error: 'Descrição é obrigatória',
      invalid_type_error: 'Descrição é obrigatória',
    })
    .min(1, 'Descrição é obrigatória'),
  amount: z
    .number({
      required_error: 'Valor é obrigatório',
      invalid_type_error: 'Informe um valor válido',
    })
    .min(0.01, 'Valor deve ser maior que zero'),
  category: z
    .string({
      required_error: 'Categoria é obrigatória',
      invalid_type_error: 'Categoria é obrigatória',
    })
    .min(1, 'Categoria é obrigatória'),
  type: z.enum(['income', 'expense'], { required_error: 'Tipo é obrigatório' }),
  status: z.enum(['pago', 'a_pagar', 'recebido', 'a_receber'], {
    required_error: 'Status é obrigatório',
  }),
  date: z
    .string({
      required_error: 'Data é obrigatória',
      invalid_type_error: 'Data é obrigatória',
    })
    .min(1, 'Data é obrigatória'), // Transaction date (ISO string)
  createdAt: z.string(), // Registration date (ISO string)
  cardId: z.string().optional(),
  installments: z
    .object({
      current: z.number(),
      total: z.number(),
    })
    .optional(),
  recurringBillId: z.string().optional(),
  recurringYearMonth: z.string().optional(), // "yyyy-MM" for dedup
  isProjected: z.boolean().optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const transactionFormSchema = transactionSchema
  .omit({ id: true, createdAt: true, installments: true })
  .extend({
    cardId: z.string().optional(),
    installmentsTotal: z.number().min(1).max(48).optional(),
    date: z
      .string()
      .min(1, 'Data é obrigatória')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  })
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

export const debtPaymentSchema = z.object({
  installmentNumber: z.number().int().positive(),
  paidAt: z.string(), // ISO string — when this installment was marked paid
  amount: z.number(),
  transactionId: z.string().optional(),
  /** True when the linked transaction was created by paying this installment
   * (versus flipping an existing card-installment transaction from a_pagar to pago).
   * Used by undo to decide between deleting vs reverting the transaction. */
  createdTransaction: z.boolean().optional(),
});
export type DebtPayment = z.infer<typeof debtPaymentSchema>;

export const debtSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  totalAmount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  installments: z.number().min(1, 'Deve ter ao menos 1 parcela'),
  installmentAmount: z
    .number()
    .min(0, 'Valor da parcela não pode ser negativo'),
  paidInstallments: z.number().int().nonnegative().optional(),
  status: z.enum(['a_pagar', 'pago']),
  dueDate: z.string(), // ISO string
  createdAt: z.string(), // ISO string
  cardId: z.string().optional(),
  paymentHistory: z.array(debtPaymentSchema).optional(),
});

export type Debt = z.infer<typeof debtSchema>;

export const debtFormSchema = debtSchema.omit({
  id: true,
  createdAt: true,
  paymentHistory: true,
});
export type DebtFormValues = z.infer<typeof debtFormSchema>;

export const CARD_BRANDS = [
  'visa',
  'mastercard',
  'elo',
  'amex',
  'hipercard',
  'diners',
  'discover',
] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

export const creditCardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  limit: z.number().min(0.01, 'Limite deve ser maior que zero'),
  limit_user_defined: z.number().min(0.01, 'Limite planejado deve ser maior que zero').optional(),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  color: z.string(),
  brand: z.enum(CARD_BRANDS).optional(),
  lastFour: z
    .string()
    .length(4)
    .regex(/^\d{4}$/)
    .optional(),
  createdAt: z.string(), // ISO string
});

export type CreditCard = z.infer<typeof creditCardSchema>;

export const creditCardFormSchema = creditCardSchema.omit({
  id: true,
  createdAt: true,
});
export type CreditCardFormValues = z.infer<typeof creditCardFormSchema>;

// ─── Recurring Bills ────────────────────────────────────────────────────────

export const recurringBillSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z
    .number({
      required_error: 'Valor é obrigatório',
      invalid_type_error: 'Informe um valor válido',
    })
    .min(0.01, 'Valor deve ser maior que zero'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['income', 'expense']),
  dueDay: z.number().int().min(1).max(31), // day of month (1–31)
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type RecurringBill = z.infer<typeof recurringBillSchema>;

export const recurringBillFormSchema = recurringBillSchema.omit({
  id: true,
  createdAt: true,
});
export type RecurringBillFormValues = z.infer<typeof recurringBillFormSchema>;

// ─── Goals (objetivos) ──────────────────────────────────────────────────────

export const goalKindSchema = z.enum(['savings', 'retirement']);
export type GoalKind = z.infer<typeof goalKindSchema>;

export const goalStatusSchema = z.enum(['active', 'completed', 'archived']);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

export const goalSchema = z.object({
  // IDs vêm do Firestore (não são UUID), por isso min(1) e não uuid().
  id: z.string().min(1),
  title: z
    .string({ required_error: 'Título é obrigatório' })
    .min(1, 'Título é obrigatório')
    .max(80, 'Título muito longo'),
  description: z.string().max(280).nullable().optional(),
  targetAmount: z
    .number({ invalid_type_error: 'Informe um valor válido' })
    .min(0.01, 'Valor deve ser maior que zero'),
  initialAmount: z
    .number({ invalid_type_error: 'Informe um valor válido' })
    .min(0, 'Não pode ser negativo'),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
    .nullable()
    .optional(),
  kind: goalKindSchema,
  status: goalStatusSchema,
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type Goal = z.infer<typeof goalSchema>;

export const goalFormSchema = goalSchema.omit({
  id: true,
  status: true,
  createdAt: true,
});
export type GoalFormValues = z.infer<typeof goalFormSchema>;

export const goalContributionSchema = z.object({
  id: z.string().min(1),
  goalId: z.string().min(1),
  amount: z
    .number({ invalid_type_error: 'Informe um valor válido' })
    .min(0.01, 'Valor deve ser maior que zero'),
  contributedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  note: z.string().max(140).nullable().optional(),
  createdAt: z.string(),
});
export type GoalContribution = z.infer<typeof goalContributionSchema>;

export const goalContributionFormSchema = goalContributionSchema.omit({
  id: true,
  createdAt: true,
});
export type GoalContributionFormValues = z.infer<
  typeof goalContributionFormSchema
>;

/** Derived view returned by useGoals — soma valor inicial + aportes manuais. */
export interface GoalWithProgress extends Goal {
  currentAmount: number;
  /** 0..1; pode passar de 1 quando objetivo é superado. */
  progress: number;
  monthsRemaining: number | null;
  /** Aporte mensal sugerido pra fechar no prazo. null se sem prazo. */
  suggestedMonthly: number | null;
  isCompleted: boolean;
}
