import { ReactNode, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  destructive?: boolean;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  onConfirm,
  isLoading,
  destructive = true,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div
            className={
              destructive
                ? 'inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400 mb-2'
                : 'inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary mb-2'
            }
          >
            <AlertTriangle className='h-5 w-5' />
          </div>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className='mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type='button'
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              destructive
                ? 'bg-red-500 hover:bg-red-500/90 text-white'
                : undefined
            }
          >
            {isLoading ? 'Aguarde…' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
