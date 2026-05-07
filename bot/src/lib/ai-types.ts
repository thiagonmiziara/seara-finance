// Shared types between AI providers (Gemini, Ollama, etc).

export type ReportPeriod = 'today' | 'week' | 'month' | 'year';

export interface ParsedTransaction {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  status: 'pago' | 'a_pagar' | 'recebido' | 'a_receber';
  date: string; // YYYY-MM-DD
}

export interface ParsedDebt {
  description: string;
  totalAmount: number;
  installments: number;
  installmentAmount: number;
  dueDate: string; // YYYY-MM-DD da próxima parcela
}

export interface ParsedRecurringBill {
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  dueDay: number; // 1-31
}

export type Intent =
  | { kind: 'transaction'; transaction: ParsedTransaction }
  | { kind: 'debt'; debt: ParsedDebt }
  | { kind: 'recurring_bill'; recurringBill: ParsedRecurringBill }
  | { kind: 'report'; period: ReportPeriod }
  | { kind: 'help' }
  | { kind: 'unknown'; reason?: string };
