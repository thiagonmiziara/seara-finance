import { useState } from 'react';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { useRecurringBillsSync } from '@/hooks/useRecurringBillsSync';
import {
  NewRecurringBillButton,
  EditRecurringBillButton,
  AddRecurringBillModal,
} from '@/components/AddRecurringBillModal';
import { RecurringBill, RecurringBillFormValues } from '@/types';
import { CATEGORIES as STATIC_CATEGORIES } from '@/lib/categories';
import { useCategories } from '@/hooks/useCategories';
import { Trash2, CalendarClock, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function BillCard({
  bill,
  onEdit,
  onToggle,
  onRemove,
  isDeleting,
  isUpdating,
}: {
  bill: RecurringBill;
  onEdit: (data: RecurringBillFormValues) => Promise<any>;
  onToggle: () => void;
  onRemove: () => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
}) {
  const { categories: dynamicCategories } = useCategories();
  const allCategories =
    dynamicCategories.length > 0 ? dynamicCategories : STATIC_CATEGORIES;
  const cat = allCategories.find((c) => c.value === bill.category);

  return (
    <div
      className={`relative flex-shrink-0 w-[200px] rounded-xl border p-3 bg-card shadow-sm transition-all ${
        bill.isActive
          ? 'border-border/60 hover:border-primary/40'
          : 'border-dashed border-border/40 opacity-60'
      }`}
    >
      {/* Header */}
      <div className='flex items-start justify-between gap-1 mb-2'>
        <div className='flex items-center gap-1.5 min-w-0'>
          {cat && (
            <span
              className='h-2.5 w-2.5 rounded-full flex-shrink-0'
              style={{ backgroundColor: cat.color }}
            />
          )}
          <span className='text-sm font-semibold truncate leading-tight text-foreground'>
            {bill.description}
          </span>
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${
            bill.isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {bill.isActive ? 'Ativa' : 'Inativa'}
        </span>
      </div>

      {/* Amount */}
      <div
        className={`text-base font-bold mb-1 ${
          bill.type === 'income' ? 'text-primary' : 'text-red-400'
        }`}
      >
        {bill.type === 'expense' ? '- ' : '+ '}
        {formatCurrency(bill.amount)}
      </div>

      {/* Due day */}
      <div className='flex items-center gap-1 text-[11px] text-muted-foreground mb-3'>
        <CalendarClock className='h-3 w-3 flex-shrink-0' />
        <span>Vence dia {bill.dueDay}</span>
      </div>

      {/* Actions */}
      <div className='flex items-center gap-1'>
        <EditRecurringBillButton bill={bill} onSave={onEdit} />
        <button
          type='button'
          title={bill.isActive ? 'Desativar' : 'Ativar'}
          onClick={onToggle}
          disabled={isUpdating}
          className='p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors'
        >
          <Power className='h-3.5 w-3.5' />
        </button>
        <button
          type='button'
          title='Remover'
          onClick={onRemove}
          disabled={isDeleting}
          className='p-1.5 rounded-md hover:bg-red-100/60 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors'
        >
          <Trash2 className='h-3.5 w-3.5' />
        </button>
      </div>
    </div>
  );
}

/** Mobile bottom-sheet like Dialog */
function MobileSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='fixed inset-x-0 bottom-0 top-auto !translate-x-0 !translate-y-0 !rounded-t-2xl !rounded-b-none max-w-none h-auto max-h-[85dvh] flex flex-col p-0 gap-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom !left-0 !right-0 border-x-0 border-b-0'>
        {/* Handle bar */}
        <div className='flex justify-center pt-3 pb-1 flex-shrink-0'>
          <div className='h-1 w-10 rounded-full bg-muted-foreground/30' />
        </div>
        <div className='flex items-center justify-between px-4 pb-3 pt-1 border-b flex-shrink-0'>
          <h3 className='font-semibold text-base'>Contas Fixas</h3>
        </div>
        <div className='overflow-y-auto flex-1 px-4 pb-6'>{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function RecurringBillsSummary() {
  // Activate auto-sync (generates transactions for current month)
  useRecurringBillsSync();

  const {
    recurringBills,
    addBill,
    updateBill,
    removeBill,
    toggleActive,
    isAdding,
    isUpdating,
    isDeleting,
  } = useRecurringBills();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const handleEdit = (bill: RecurringBill) => (data: RecurringBillFormValues) =>
    updateBill({ id: bill.id, data });

  const totalMonthly = recurringBills
    .filter((b) => b.isActive)
    .reduce((sum, b) => sum + (b.type === 'expense' ? -b.amount : b.amount), 0);

  const billList = (
    <div className='space-y-2 pt-3'>
      {recurringBills.length === 0 ? (
        <div className='text-center py-8 text-muted-foreground text-sm'>
          <CalendarClock className='h-8 w-8 mx-auto mb-2 opacity-30' />
          <p>Nenhuma conta fixa cadastrada.</p>
          <p className='text-xs mt-1'>
            Adicione contas como luz, internet, streaming e elas serão lançadas
            automaticamente todo mês.
          </p>
        </div>
      ) : (
        recurringBills.map((bill) => (
          <div
            key={bill.id}
            className='flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5 gap-3'
          >
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-sm truncate'>
                  {bill.description}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    bill.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {bill.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className='flex items-center gap-2 mt-0.5'>
                <span
                  className={`text-sm font-bold ${
                    bill.type === 'income' ? 'text-primary' : 'text-red-400'
                  }`}
                >
                  {bill.type === 'expense' ? '- ' : '+ '}
                  {formatCurrency(bill.amount)}
                </span>
                <span className='text-[11px] text-muted-foreground'>
                  · Vence dia {bill.dueDay}
                </span>
              </div>
            </div>
            <div className='flex items-center gap-0.5 flex-shrink-0'>
              <EditRecurringBillButton
                bill={bill}
                onSave={handleEdit(bill)}
                isSaving={isUpdating}
              />
              <button
                type='button'
                onClick={() => toggleActive(bill)}
                disabled={isUpdating}
                className='p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors'
                title={bill.isActive ? 'Desativar' : 'Ativar'}
              >
                <Power className='h-3.5 w-3.5' />
              </button>
              <button
                type='button'
                onClick={() => removeBill(bill.id)}
                disabled={isDeleting}
                className='p-1.5 rounded-md hover:bg-red-100/60 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors'
                title='Remover'
              >
                <Trash2 className='h-3.5 w-3.5' />
              </button>
            </div>
          </div>
        ))
      )}

      {/* Add inside list */}
      <div className='pt-1'>
        <Button
          size='sm'
          variant='ghost'
          className='w-full border-dashed border border-border/60 text-muted-foreground hover:text-foreground'
          onClick={() => setAddOpen(true)}
        >
          + Nova conta fixa
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── DESKTOP — section above filters ─────────────────────────────── */}
      <div className='hidden md:block'>
        <div className='bg-card border border-border/50 rounded-xl p-4 shadow-sm'>
          <div className='flex items-center justify-between mb-3 flex-wrap gap-2'>
            <div className='flex items-center gap-2 min-w-0'>
              <CalendarClock className='h-4 w-4 text-primary flex-shrink-0' />
              <h3 className='font-semibold text-sm'>Contas Fixas do Mês</h3>
              {recurringBills.length > 0 && (
                <span className='text-xs text-muted-foreground'>
                  · Total ativo:{' '}
                  <span
                    className={
                      totalMonthly >= 0 ? 'text-primary font-medium' : 'text-red-400 font-medium'
                    }
                  >
                    {formatCurrency(Math.abs(totalMonthly))}
                  </span>
                </span>
              )}
            </div>
            <NewRecurringBillButton onSave={addBill} isSaving={isAdding} />
          </div>

          {recurringBills.length === 0 ? (
            <div className='flex items-center gap-3 py-2 text-muted-foreground text-sm'>
              <CalendarClock className='h-5 w-5 opacity-40 flex-shrink-0' />
              <span>
                Nenhuma conta fixa ainda. Adicione contas como luz, internet ou streaming — elas serão lançadas automaticamente todo mês.
              </span>
            </div>
          ) : (
            <div className='flex gap-3 overflow-x-auto pb-1'>
              {recurringBills.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onEdit={handleEdit(bill)}
                  onToggle={() => toggleActive(bill)}
                  onRemove={() => removeBill(bill.id)}
                  isDeleting={isDeleting}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── MOBILE — FAB button ──────────────────────────────────────────── */}
      <div className='md:hidden'>
        <button
          onClick={() => setMobileOpen(true)}
          className='fixed bottom-6 left-4 z-30 flex items-center gap-2 bg-card border border-border shadow-lg rounded-full px-4 py-2.5 text-sm font-medium hover:border-primary/40 hover:shadow-primary/10 transition-all active:scale-95'
        >
          <CalendarClock className='h-4 w-4 text-primary flex-shrink-0' />
          <span>Fixas</span>
          {recurringBills.filter((b) => b.isActive).length > 0 && (
            <span className='bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center flex-shrink-0'>
              {recurringBills.filter((b) => b.isActive).length}
            </span>
          )}
        </button>

        <MobileSheet open={mobileOpen} onClose={() => setMobileOpen(false)}>
          {billList}
        </MobileSheet>
      </div>

      {/* Global add modal */}
      <AddRecurringBillModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={addBill}
        isSaving={isAdding}
      />
    </>
  );
}
