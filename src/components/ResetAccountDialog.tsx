import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CONFIRM_WORD = 'deletar';

interface ResetAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export function ResetAccountDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: ResetAccountDialogProps) {
  const [confirmText, setConfirmText] = useState('');

  // Zera o input sempre que o modal abre/fecha.
  useEffect(() => {
    if (!open) setConfirmText('');
  }, [open]);

  const canDelete =
    confirmText.trim().toLowerCase() === CONFIRM_WORD && !isDeleting;

  const handleConfirm = async () => {
    if (!canDelete) return;
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (e) {
      console.error('[ResetAccountDialog] falha ao zerar conta', e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isDeleting && onOpenChange(o)}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400 mb-2'>
            <AlertTriangle className='h-6 w-6' />
          </div>
          <DialogTitle>Zerar toda a sua conta?</DialogTitle>
          <DialogDescription>
            Esta ação é <strong>irreversível</strong>. Não há como desfazer nem
            recuperar depois.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400'>
            <p className='font-semibold'>
              Tudo das contas <strong>Pessoal</strong> e{' '}
              <strong>Empresarial</strong> será apagado:
            </p>
            <ul className='mt-2 list-disc pl-5 space-y-0.5 text-red-700/90 dark:text-red-400/90'>
              <li>Transações e transferências</li>
              <li>Cartões e faturas</li>
              <li>Dívidas</li>
              <li>Contas fixas</li>
              <li>Categorias e regras de categorização</li>
              <li>Objetivos e aportes</li>
            </ul>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='reset-confirm'>
              Para confirmar, digite{' '}
              <span className='font-bold text-foreground'>{CONFIRM_WORD}</span>{' '}
              abaixo:
            </Label>
            <Input
              id='reset-confirm'
              autoFocus
              autoComplete='off'
              placeholder={CONFIRM_WORD}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
              }}
              disabled={isDeleting}
            />
          </div>
        </div>

        <div className='mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            onClick={handleConfirm}
            disabled={!canDelete}
            className='bg-red-500 hover:bg-red-500/90 text-white disabled:opacity-50'
          >
            {isDeleting ? 'Apagando…' : 'Deletar tudo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
