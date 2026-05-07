import { useMemo, useState } from 'react';
import { Plus, Trash2, Lock } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { cn } from '@/lib/utils';

const COLOR_PALETTE = [
  '#2563eb', '#2563eb', '#ef4444', '#f59e0b', '#8b5cf6',
  '#e11d48', '#0ea5a4', '#06b6d4', '#0ea5e9', '#f97316',
  '#3b82f6', '#7c3aed', '#ef7b45', '#1e293b', '#374151',
];

export default function CategoriesPage() {
  const { categories, addCategory, deleteCategory, loading } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState<string>(COLOR_PALETTE[0]);
  const [submitting, setSubmitting] = useState(false);

  const defaultValueSet = useMemo(
    () => new Set(DEFAULT_CATEGORIES.map((c) => c.value)),
    [],
  );

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.label.localeCompare(b.label)),
    [categories],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await addCategory({ label: trimmed, color });
      setLabel('');
      setColor(COLOR_PALETTE[0]);
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
        <div>
          <h1 className='text-3xl font-extrabold tracking-tight font-display'>
            Categorias
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Organize suas transações com categorias personalizadas. As padrão
            ficam protegidas.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className='shrink-0'>
              <Plus className='mr-2 h-4 w-4' />
              Nova categoria
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>Nova categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='space-y-4 mt-2'>
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                  Nome
                </label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder='Ex.: Pets'
                  autoFocus
                  required
                  maxLength={40}
                />
              </div>
              <div className='space-y-2'>
                <label className='text-xs font-bold uppercase tracking-widest text-muted-foreground'>
                  Cor
                </label>
                <div className='grid grid-cols-8 gap-2'>
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type='button'
                      onClick={() => setColor(c)}
                      className={cn(
                        'h-8 w-8 rounded-full border-2 transition-all',
                        color === c
                          ? 'border-foreground scale-110 shadow-soft'
                          : 'border-transparent hover:scale-105',
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className='flex justify-end gap-2 pt-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type='submit' disabled={submitting || !label.trim()}>
                  {submitting ? 'Salvando...' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='h-16 rounded-xl bg-muted animate-pulse' />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className='rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground'>
          Nenhuma categoria ainda.
        </div>
      ) : (
        <ul className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {sorted.map((cat) => {
            const isDefault = defaultValueSet.has(cat.value);
            return (
              <li
                key={cat.value}
                className='flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 hover:border-primary/30 transition-colors'
              >
                <span
                  className='h-9 w-9 rounded-full shrink-0 ring-1 ring-border/50'
                  style={{ backgroundColor: cat.color }}
                />
                <div className='flex-1 min-w-0'>
                  <div className='font-semibold truncate'>{cat.label}</div>
                  <div className='text-[11px] text-muted-foreground font-mono truncate'>
                    {cat.value}
                  </div>
                </div>
                {isDefault ? (
                  <span
                    className='inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted rounded-full px-2 py-1'
                    title='Categoria padrão protegida'
                  >
                    <Lock className='h-3 w-3' />
                    padrão
                  </span>
                ) : (
                  <ConfirmDialog
                    trigger={
                      <button
                        type='button'
                        className='p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'
                        aria-label={`Excluir ${cat.label}`}
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    }
                    title='Excluir categoria?'
                    description={`A categoria "${cat.label}" será removida. Transações que usam essa categoria continuarão existindo, mas perderão a etiqueta.`}
                    onConfirm={() => deleteCategory(cat.value)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
