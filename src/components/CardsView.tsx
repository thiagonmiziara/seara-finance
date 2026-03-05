import { useState } from 'react';
import { useCards } from '@/hooks/useCards';
import { useFinance } from '@/hooks/useFinance';
import { useDebts } from '@/hooks/useDebts';
import { AddCardModal } from './AddCardModal';
import { EditCardLimitModal } from './EditCardLimitModal';
import { DeleteCardDialog } from './DeleteCardDialog';
import { CardBrandIcon } from './CardBrandIcon';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard,
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarRange,
  Check,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CardsView() {
  const {
    cards,
    addCard,
    deleteCard,
    updateCard,
    isAdding,
    isDeleting,
    isUpdating,
    isLoading,
  } = useCards();
  const { transactions, payInvoiceMonth, isPayingInvoice } = useFinance();
  const { debts, incrementInstallment } = useDebts();
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedDebts, setExpandedDebts] = useState<Record<string, boolean>>(
    {},
  );
  const [pendingPayMonth, setPendingPayMonth] = useState<
    Record<string, string | null>
  >({});

  const toggleForecast = (cardId: string) => {
    setExpandedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const toggleDebts = (cardId: string) => {
    setExpandedDebts((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      <div className='flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 bg-card p-4 rounded-xl border border-border/50 shadow-sm'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Cartões de Crédito
          </h2>
          <p className='text-muted-foreground'>
            Gerencie seus cartões e controle os limites disponíveis.
          </p>
        </div>
        <AddCardModal onAddCard={addCard} isAdding={isAdding} />
      </div>

      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-3'>
          <Skeleton className='h-[200px]' />
          <Skeleton className='h-[200px]' />
        </div>
      ) : cards.length === 0 ? (
        <div className='flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed border-border/60 text-center space-y-4'>
          <div className='h-16 w-16 bg-muted rounded-full flex items-center justify-center'>
            <CreditCard className='h-8 w-8 text-muted-foreground' />
          </div>
          <div>
            <h3 className='font-semibold text-lg'>Nenhum cartão cadastrado</h3>
            <p className='text-muted-foreground max-w-sm mt-1'>
              Cadastre seus cartões de crédito para conseguir vincular compras
              parceladas a eles.
            </p>
          </div>
        </div>
      ) : (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {cards.map((card) => {
            const cardTransactions = transactions.filter(
              (t) => t.cardId === card.id && t.status === 'a_pagar',
            );

            // Calcular dívidas pendentes deste cartão
            const cardDebts = debts
              .filter((d) => d.cardId === card.id && d.status !== 'pago')
              .filter((d) => {
                // Remover dívidas completamente quitadas (todas as parcelas pagas)
                const remainingInstallments =
                  d.installments - (d.paidInstallments || 0);
                return remainingInstallments > 0;
              });
            const cardDebtRemaining = cardDebts.reduce((acc, d) => {
              const paidAmount =
                (d.paidInstallments || 0) * d.installmentAmount;
              return acc + (d.totalAmount - paidAmount);
            }, 0);

            const transactionUsed = cardTransactions.reduce(
              (acc, t) => acc + t.amount,
              0,
            );
            // Usar apenas dívidas para calcular o limite consumido (evita dupla contagem
            // com transações parceladas que podem já estar representadas como dívidas)
            const usedLimit =
              cardDebts.length > 0 ? cardDebtRemaining : transactionUsed;
            const availableLimit = Math.max(0, card.limit - usedLimit);
            const usagePercentage = Math.min(
              100,
              Math.max(0, (usedLimit / card.limit) * 100),
            );

            // Group pending transactions by month for invoice forecast
            const invoicesByMonth: Record<
              string,
              { month: string; total: number; count: number }
            > = {};

            if (cardDebts.length > 0) {
              // Build forecast from debt installment schedules (same source of
              // truth as usedLimit) to avoid gaps when transactions are missing
              // or out of sync with debt paidInstallments.
              cardDebts.forEach((d) => {
                if (!d.dueDate) return;
                const startPaid = d.paidInstallments || 0;
                for (let i = startPaid + 1; i <= d.installments; i++) {
                  try {
                    const due = new Date(
                      d.dueDate.includes('T')
                        ? d.dueDate
                        : `${d.dueDate}T00:00:00`,
                    );
                    // dueDate is the first installment due date; shift by (i-1) months
                    const instDate = new Date(
                      due.getFullYear(),
                      due.getMonth() + (i - 1),
                      due.getDate(),
                    );
                    const key = `${instDate.getFullYear()}-${String(instDate.getMonth() + 1).padStart(2, '0')}`;
                    const monthLabel = format(instDate, 'MMMM yyyy', {
                      locale: ptBR,
                    });
                    if (!invoicesByMonth[key]) {
                      invoicesByMonth[key] = {
                        month: monthLabel,
                        total: 0,
                        count: 0,
                      };
                    }
                    invoicesByMonth[key].total += d.installmentAmount;
                    invoicesByMonth[key].count += 1;
                  } catch {
                    /* skip invalid dates */
                  }
                }
              });
            } else {
              // Fallback: use transaction records when no debts exist
              cardTransactions.forEach((t) => {
                if (!t.date) return;
                try {
                  const date = new Date(
                    t.date.includes('T') ? t.date : `${t.date}T00:00:00`,
                  );
                  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                  const monthLabel = format(date, 'MMMM yyyy', {
                    locale: ptBR,
                  });
                  if (!invoicesByMonth[key]) {
                    invoicesByMonth[key] = {
                      month: monthLabel,
                      total: 0,
                      count: 0,
                    };
                  }
                  invoicesByMonth[key].total += t.amount;
                  invoicesByMonth[key].count += 1;
                } catch {
                  /* skip invalid dates */
                }
              });
            }

            // Total pendente: use debt remaining when available (source of truth)
            const forecastTotal =
              cardDebts.length > 0 ? cardDebtRemaining : transactionUsed;

            const sortedInvoices = Object.entries(invoicesByMonth)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, v]) => ({ ...v, key: k }));

            const isExpanded = expandedCards[card.id] ?? false;

            return (
              <Card
                key={card.id}
                className='overflow-hidden hover:shadow-lg transition-all duration-300 border-border/40'
              >
                {/* Physical card face */}
                <div
                  className='relative p-5 pb-4 min-h-[170px] flex flex-col justify-between'
                  style={{
                    background: `linear-gradient(135deg, ${card.color}22 0%, ${card.color}44 100%)`,
                    borderBottom: `3px solid ${card.color}`,
                  }}
                >
                  {/* Top row: brand icon + CRÉDITO label + edit */}
                  <div className='flex items-center justify-between'>
                    <CardBrandIcon
                      brand={card.brand}
                      className='h-8 w-auto'
                      lucideSize={28}
                    />
                    <div className='flex items-center gap-1.5'>
                      <span className='text-xs font-mono text-muted-foreground tracking-widest'>
                        CRÉDITO
                      </span>
                      <EditCardLimitModal
                        card={card}
                        onUpdateLimit={updateCard}
                        isUpdating={isUpdating}
                      />
                    </div>
                  </div>

                  {/* Card number masked */}
                  <div className='mt-4 font-mono text-base tracking-widest text-foreground/80 select-none'>
                    •••• &nbsp;•••• &nbsp;•••• &nbsp;{card.lastFour ?? '••••'}
                  </div>

                  {/* Card name + dates */}
                  <div className='mt-3 flex items-end justify-between'>
                    <div>
                      <p className='text-xs text-muted-foreground'>Titular</p>
                      <p className='font-semibold text-sm tracking-wide uppercase truncate max-w-[150px]'>
                        {card.name}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs text-muted-foreground'>
                        Fecha / Vence
                      </p>
                      <p className='text-xs font-medium'>
                        Dia {card.closingDay} / {card.dueDay}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Limit bar section */}
                <CardContent className='pb-3 pt-4 space-y-3'>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-muted-foreground'>Limite Total:</span>
                    <span className='font-semibold'>
                      {formatCurrency(card.limit)}
                    </span>
                  </div>

                  <div className='space-y-1.5'>
                    <div className='flex justify-between text-xs mb-1'>
                      <span className='text-muted-foreground'>Disponível</span>
                      <span className='font-medium text-emerald-500'>
                        {formatCurrency(availableLimit)}
                      </span>
                    </div>
                    <div className='h-2 w-full bg-secondary rounded-full overflow-hidden'>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          usagePercentage > 90
                            ? 'bg-red-500'
                            : usagePercentage > 75
                              ? 'bg-yellow-500'
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${100 - usagePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Invoice Forecast Section */}
                  {(sortedInvoices.length > 0 || cardDebts.length > 0) && (
                    <div className='pt-2 border-t border-border/50 space-y-3'>
                      {/* Parcelas a Pagar Section */}
                      {cardDebts.length > 0 &&
                        (() => {
                          const isDebtsExpanded =
                            expandedDebts[card.id] ?? false;
                          return (
                            <div>
                              <button
                                onClick={() => toggleDebts(card.id)}
                                className='flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors mb-2'
                              >
                                <span className='flex items-center gap-1.5 font-medium'>
                                  <AlertCircle className='h-3.5 w-3.5' />
                                  Parcelas a Pagar ({cardDebts.length})
                                </span>
                                {isDebtsExpanded ? (
                                  <ChevronUp className='h-4 w-4' />
                                ) : (
                                  <ChevronDown className='h-4 w-4' />
                                )}
                              </button>
                              {isDebtsExpanded && (
                                <div className='space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200'>
                                  {cardDebts.map((debt) => {
                                    const paidCount =
                                      debt.paidInstallments || 0;
                                    const remainingInstallments =
                                      debt.installments - paidCount;
                                    return (
                                      <div
                                        key={debt.id}
                                        className='text-xs bg-muted/40 rounded-md px-3 py-2 space-y-1.5'
                                      >
                                        {/* Header da dívida */}
                                        <div className='flex items-center justify-between'>
                                          <p className='text-muted-foreground capitalize font-medium'>
                                            {debt.description}
                                          </p>
                                          <span className='text-[10px] text-muted-foreground/70'>
                                            {paidCount}/{debt.installments}{' '}
                                            pagas
                                          </span>
                                        </div>
                                        {/* Lista de parcelas individuais */}
                                        <div className='space-y-1'>
                                          {Array.from({
                                            length: debt.installments,
                                          }).map((_, i) => {
                                            const isPaid = i < paidCount;
                                            const isNext = i === paidCount;
                                            return (
                                              <div
                                                key={i}
                                                className={`flex items-center justify-between rounded px-2 py-1 transition-all duration-300 ${
                                                  isPaid
                                                    ? 'opacity-60'
                                                    : isNext
                                                      ? 'bg-emerald-500/10'
                                                      : ''
                                                }`}
                                              >
                                                <div className='flex items-center gap-1.5 flex-1'>
                                                  {isPaid && (
                                                    <div className='h-px w-3 bg-emerald-500 rounded' />
                                                  )}
                                                  <span
                                                    className={`transition-all duration-300 ${
                                                      isPaid
                                                        ? 'line-through text-emerald-500/70'
                                                        : 'text-foreground/80'
                                                    }`}
                                                  >
                                                    Parcela {i + 1}
                                                  </span>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                  <span
                                                    className={`font-semibold transition-all duration-300 ${
                                                      isPaid
                                                        ? 'line-through text-emerald-500/70'
                                                        : 'text-foreground'
                                                    }`}
                                                  >
                                                    {formatCurrency(
                                                      debt.installmentAmount,
                                                    )}
                                                  </span>
                                                  {isPaid ? (
                                                    <Check className='h-3.5 w-3.5 text-emerald-500' />
                                                  ) : isNext ? (
                                                    <button
                                                      onClick={() =>
                                                        incrementInstallment(
                                                          debt,
                                                        )
                                                      }
                                                      className='text-emerald-500 hover:text-emerald-600 hover:scale-110 transition-all'
                                                      title='Pagar esta parcela'
                                                    >
                                                      <Check className='h-3.5 w-3.5' />
                                                    </button>
                                                  ) : (
                                                    <AlertCircle className='h-3.5 w-3.5 text-muted-foreground/40' />
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        {/* Valor restante */}
                                        <div className='flex justify-between pt-1 border-t border-border/30'>
                                          <span className='text-muted-foreground/70'>
                                            Restante
                                          </span>
                                          <span className='font-semibold text-red-500'>
                                            {formatCurrency(
                                              remainingInstallments *
                                                debt.installmentAmount,
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      {/* Forecast Section */}
                      {sortedInvoices.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleForecast(card.id)}
                            className='flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground transition-colors'
                          >
                            <span className='flex items-center gap-1.5 font-medium'>
                              <CalendarRange className='h-3.5 w-3.5' />
                              Previsão de Fatura ({sortedInvoices.length}{' '}
                              {sortedInvoices.length === 1 ? 'mês' : 'meses'})
                            </span>
                            {isExpanded ? (
                              <ChevronUp className='h-4 w-4' />
                            ) : (
                              <ChevronDown className='h-4 w-4' />
                            )}
                          </button>

                          {isExpanded && (
                            <div className='mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200'>
                              {sortedInvoices.map((invoice) => {
                                const isPending =
                                  pendingPayMonth[card.id] === invoice.key;
                                const isThisLoading =
                                  isPayingInvoice &&
                                  pendingPayMonth[card.id] === invoice.key;
                                return (
                                  <div
                                    key={invoice.month}
                                    className='flex items-center justify-between text-xs bg-muted/40 rounded-md px-3 py-2 gap-2'
                                  >
                                    <span className='capitalize text-muted-foreground flex-1'>
                                      {invoice.month}
                                    </span>
                                    <div className='flex items-center gap-2'>
                                      <span className='text-muted-foreground text-[10px]'>
                                        {invoice.count}{' '}
                                        {invoice.count === 1
                                          ? 'parcela'
                                          : 'parcelas'}
                                      </span>
                                      <span className='font-semibold text-foreground'>
                                        {formatCurrency(invoice.total)}
                                      </span>
                                    </div>
                                    {isPending ? (
                                      <div className='flex items-center gap-1 animate-in fade-in duration-150'>
                                        <span className='text-[10px] text-amber-400 whitespace-nowrap'>
                                          Confirmar?
                                        </span>
                                        <button
                                          disabled={isThisLoading}
                                          onClick={() => {
                                            const transactionIds = transactions
                                              .filter((t) => {
                                                if (
                                                  t.cardId !== card.id ||
                                                  t.status !== 'a_pagar'
                                                )
                                                  return false;
                                                if (!t.date) return false;
                                                const dateStr = t.date.includes(
                                                  'T',
                                                )
                                                  ? t.date
                                                  : `${t.date}T00:00:00`;
                                                const d = new Date(dateStr);
                                                const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                                return k === invoice.key;
                                              })
                                              .map((t) => t.id);

                                            // Find which debt installments fall in this invoice month
                                            const [tyear, tmonth] = invoice.key
                                              .split('-')
                                              .map(Number);
                                            const debtUpdates = cardDebts
                                              .filter((d) => d.dueDate)
                                              .flatMap((d) => {
                                                const due = new Date(
                                                  d.dueDate.includes('T')
                                                    ? d.dueDate
                                                    : `${d.dueDate}T00:00:00`,
                                                );
                                                const idx =
                                                  (tyear - due.getFullYear()) *
                                                    12 +
                                                  (tmonth -
                                                    (due.getMonth() + 1)) +
                                                  1;
                                                const currentPaid =
                                                  d.paidInstallments || 0;
                                                if (
                                                  idx < 1 ||
                                                  idx > d.installments ||
                                                  idx <= currentPaid
                                                )
                                                  return [];
                                                return [
                                                  {
                                                    id: d.id,
                                                    paidInstallments: idx,
                                                    status:
                                                      idx >= d.installments
                                                        ? 'pago'
                                                        : 'a_pagar',
                                                  },
                                                ];
                                              });

                                            payInvoiceMonth({
                                              cardId: card.id,
                                              yearMonth: invoice.key,
                                              transactionIds,
                                              debtUpdates,
                                            })
                                              .then(() =>
                                                setPendingPayMonth((prev) => ({
                                                  ...prev,
                                                  [card.id]: null,
                                                })),
                                              )
                                              .catch(() =>
                                                setPendingPayMonth((prev) => ({
                                                  ...prev,
                                                  [card.id]: null,
                                                })),
                                              );
                                          }}
                                          className='text-emerald-500 hover:text-emerald-400 disabled:opacity-50 transition-all'
                                          title='Confirmar pagamento'
                                        >
                                          {isThisLoading ? (
                                            <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                          ) : (
                                            <Check className='h-3.5 w-3.5' />
                                          )}
                                        </button>
                                        <button
                                          disabled={isThisLoading}
                                          onClick={() =>
                                            setPendingPayMonth((prev) => ({
                                              ...prev,
                                              [card.id]: null,
                                            }))
                                          }
                                          className='text-muted-foreground hover:text-foreground disabled:opacity-50 transition-all'
                                          title='Cancelar'
                                        >
                                          <X className='h-3.5 w-3.5' />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          setPendingPayMonth((prev) => ({
                                            ...prev,
                                            [card.id]: invoice.key,
                                          }))
                                        }
                                        className='text-muted-foreground/40 hover:text-emerald-500 transition-all'
                                        title='Marcar fatura como paga'
                                      >
                                        <Check className='h-3.5 w-3.5' />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                              <div className='flex justify-between text-xs font-semibold pt-1.5 px-3'>
                                <span>Total pendente:</span>
                                <span className='text-red-500'>
                                  {formatCurrency(forecastTotal)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className='bg-muted/30 px-6 py-3 border-t border-border/40 flex justify-end'>
                  <DeleteCardDialog
                    card={card}
                    pendingTransactions={cardTransactions}
                    onConfirmDelete={deleteCard}
                    isDeleting={isDeleting}
                    trigger={
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2'
                        disabled={isDeleting}
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
                        Excluir
                      </Button>
                    }
                  />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
