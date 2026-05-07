-- Track per-installment payment history on debts so we can undo individual
-- payments, run backfills, and link each payment to the transaction that
-- debited the account balance.

alter table public.debts
  add column if not exists payment_history jsonb not null default '[]'::jsonb;

-- Each entry has shape:
--   { installmentNumber: int, paidAt: ISO string, amount: number,
--     transactionId?: uuid string, createdTransaction?: bool }
-- transactionId is the transactions row that reflects this payment in the
-- account balance (created on the fly for non-card debts, flipped from
-- a_pagar→pago for card-linked debts). createdTransaction distinguishes the
-- two so undo can decide between deleting vs reverting the transaction.
