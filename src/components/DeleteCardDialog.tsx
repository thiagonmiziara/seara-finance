import { useState } from 'react';
import { CreditCard, Transaction } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteCardDialogProps {
    card: CreditCard;
    pendingTransactions: Transaction[];
    onConfirmDelete: (data: { id: string; cardName: string; cascadeDelete: boolean }) => Promise<any>;
    isDeleting?: boolean;
    trigger: React.ReactNode;
}

export function DeleteCardDialog({ card, pendingTransactions, onConfirmDelete, isDeleting, trigger }: DeleteCardDialogProps) {
    const [open, setOpen] = useState(false);

    const hasPendingInstallments = pendingTransactions.length > 0;
    const totalPendingAmount = pendingTransactions.reduce((acc, t) => acc + t.amount, 0);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleDelete = async () => {
        try {
            await onConfirmDelete({
                id: card.id,
                cardName: card.name,
                cascadeDelete: hasPendingInstallments,
            });
            setOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div onClick={() => setOpen(true)}>
                {trigger}
            </div>
            <DialogContent className='sm:max-w-[450px]'>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {hasPendingInstallments && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        Excluir cartão {card.name}?
                    </DialogTitle>
                    <DialogDescription>
                        {hasPendingInstallments
                            ? 'Este cartão possui parcelas em aberto. Se excluir, as dívidas e transações associadas também serão excluídas.'
                            : 'Esta ação não pode ser desfeita. O cartão será removido permanentemente.'}
                    </DialogDescription>
                </DialogHeader>

                {hasPendingInstallments && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-yellow-500 font-semibold text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Atenção: Parcelas em aberto
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Parcelas pendentes:</span>
                                <span className="font-medium text-foreground">{pendingTransactions.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Valor total pendente:</span>
                                <span className="font-medium text-red-500">{formatCurrency(totalPendingAmount)}</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Ao excluir, todas as parcelas pendentes e dívidas associadas a este cartão na aba "Dívidas" serão removidas.
                        </p>
                    </div>
                )}

                <div className='flex justify-end space-x-2 pt-4 border-t border-border/50'>
                    <Button
                        type='button'
                        variant='outline'
                        onClick={() => setOpen(false)}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className='min-w-[140px]'
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Excluindo...' : 'Excluir Cartão'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
