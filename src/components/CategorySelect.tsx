import { useState } from 'react';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES as STATIC_CATEGORIES } from '@/lib/categories';
import { useCategories } from '@/hooks/useCategories';
import { showToast } from '@/lib/toast';

interface CategorySelectProps {
  /** Currently selected category value (bound to a form field) */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Self-contained category picker: a color-dot Select, an inline "create
 * category" flow, a manage list for custom categories, and a delete
 * confirmation dialog. Wraps useCategories so callers only bind value/onChange.
 */
export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const {
    categories: dynamicCategories,
    addCategory,
    deleteCategory,
  } = useCategories();

  const [showManage, setShowManage] = useState(false);
  const [confirmCategory, setConfirmCategory] = useState<null | {
    value: string;
    label: string;
    color: string;
  }>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const displayCategories =
    dynamicCategories.length > 0 ? dynamicCategories : STATIC_CATEGORIES;
  const selected =
    dynamicCategories.find((c) => c.value === value) ||
    STATIC_CATEGORIES.find((c) => c.value === value);
  const customCategories = dynamicCategories.filter(
    (c) => !STATIC_CATEGORIES.find((s) => s.value === c.value),
  );

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setCreating(true);
      const created = await addCategory({ label: newCategoryName.trim() });
      onChange(created.value);
      setNewCategoryName('');
    } catch (e) {
      // swallow - addCategory throws if no user
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmCategory) return;
    const deleted = { ...confirmCategory };
    try {
      await deleteCategory(confirmCategory.value);
      if (value === confirmCategory.value) {
        onChange(STATIC_CATEGORIES[0].value);
      }
      showToast({
        message: `Categoria "${deleted.label}" removida`,
        type: 'success',
        duration: 5000,
        actionLabel: 'Desfazer',
        onAction: async () => {
          try {
            const recreated = await addCategory({
              label: deleted.label,
              color: deleted.color,
            });
            if (value === STATIC_CATEGORIES[0].value) {
              onChange(recreated.value);
            }
          } catch (e) {}
        },
      });
    } catch (e) {
      showToast({ message: 'Falha ao remover categoria', type: 'error' });
    } finally {
      setConfirmOpen(false);
      setConfirmCategory(null);
    }
  };

  return (
    <>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger>
          <SelectValue>
            {selected ? (
              <span className='inline-flex items-center gap-2'>
                <span
                  className='h-2 w-2 rounded-full'
                  style={{ backgroundColor: selected.color }}
                />
                <span>{selected.label}</span>
              </span>
            ) : (
              <span className='text-muted-foreground'>
                Selecione a categoria
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {displayCategories.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              <span className='inline-flex items-center gap-2'>
                <span
                  className='h-2 w-2 rounded-full'
                  style={{ backgroundColor: c.color }}
                />
                <span>{c.label}</span>
              </span>
            </SelectItem>
          ))}
          <SelectItem key='criar_categoria' value='criar_categoria'>
            + Criar categoria
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Inline create field, shown when "+ Criar categoria" is chosen */}
      {value === 'criar_categoria' && (
        <div className='mt-2 flex gap-2'>
          <Input
            placeholder='Nome da nova categoria'
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className='flex-1'
          />
          <Button type='button' onClick={handleCreate}>
            {creating ? 'Criando...' : 'Criar'}
          </Button>
        </div>
      )}

      {/* Manage custom categories (separate UI avoids select-item click interference) */}
      {customCategories.length > 0 && (
        <div className='mt-2'>
          <button
            type='button'
            className='text-sm text-muted-foreground underline'
            onClick={() => setShowManage((s) => !s)}
          >
            {showManage ? 'Fechar gerenciamento' : 'Gerenciar categorias'}
          </button>

          {showManage && (
            <div className='mt-2 space-y-2'>
              {customCategories.map((c) => (
                <div
                  key={c.value}
                  className='flex items-center gap-2 bg-card p-2 rounded-md border border-border/40'
                >
                  <span
                    className='inline-block h-3 w-3 rounded-full'
                    style={{ backgroundColor: c.color }}
                  />
                  <span className='flex-1 text-sm'>{c.label}</span>
                  <button
                    type='button'
                    className='p-1 rounded hover:bg-muted/20'
                    onClick={() => {
                      setConfirmCategory({
                        value: c.value,
                        label: c.label,
                        color: c.color,
                      });
                      setConfirmOpen(true);
                    }}
                    aria-label={`Remover ${c.label}`}
                  >
                    <Trash className='h-4 w-4 text-red-400' />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation dialog for deleting a category */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(v) => {
          setConfirmOpen(v);
          if (!v) setConfirmCategory(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover categoria</DialogTitle>
            <DialogDescription>
              Essa ação é irreversível — as transações existentes NÃO serão
              removidas, mas a categoria será excluída para novos usos.
            </DialogDescription>
          </DialogHeader>
          <div className='py-2'>
            <div className='text-sm'>
              Deseja realmente excluir a categoria{' '}
              <strong>{confirmCategory?.label}</strong>?
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='ghost'
              onClick={() => {
                setConfirmOpen(false);
                setConfirmCategory(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
