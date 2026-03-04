import { useCards } from '@/hooks/useCards';
import { useFinance } from '@/hooks/useFinance';
import { AddCardModal } from './AddCardModal';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CardsView() {
    const { cards, addCard, deleteCard, isAdding, isDeleting, isLoading } = useCards();
    const { transactions } = useFinance();

    return (
        <div className='space-y-8 animate-in fade-in duration-500'>
            <div className='flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 bg-card p-4 rounded-xl border border-border/50 shadow-sm'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>Cartões de Crédito</h2>
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
                            Cadastre seus cartões de crédito para conseguir vincular compras parceladas a eles.
                        </p>
                    </div>
                </div>
            ) : (
                <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                    {cards.map((card) => {
                        const usedLimit = transactions
                            .filter((t) => t.cardId === card.id && t.status === 'a_pagar')
                            .reduce((acc, t) => acc + t.amount, 0);

                        const availableLimit = Math.max(0, card.limit - usedLimit);
                        const usagePercentage = Math.min(100, Math.max(0, (usedLimit / card.limit) * 100));

                        return (
                            <Card key={card.id} className="overflow-hidden bg-gradient-to-br from-card to-card hover:shadow-md transition-all duration-300 relative border-border/40">
                                <div
                                    className="absolute top-0 left-0 w-full h-2"
                                    style={{ backgroundColor: card.color }}
                                />
                                <CardHeader className="pt-6 pb-2 flex justify-between flex-row items-center">
                                    <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" style={{ color: card.color }} />
                                        {card.name}
                                    </CardTitle>
                                    <div className="text-xs font-mono text-muted-foreground">CRÉDITO</div>
                                </CardHeader>
                                <CardContent className="pb-4 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Limite Total:</span>
                                        <span className="font-semibold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit)}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">Limite Disponível</span>
                                            <span className="font-medium text-emerald-500">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(availableLimit)}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${100 - usagePercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-xs pt-2 border-t border-border/50">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground">Fechamento</span>
                                            <span className="font-medium">Dia {card.closingDay}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-muted-foreground">Vencimento</span>
                                            <span className="font-medium">Dia {card.dueDay}</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 px-6 py-3 border-t border-border/40 flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2"
                                        disabled={isDeleting}
                                        onClick={() => {
                                            if (window.confirm('Tem certeza que deseja excluir este cartão? Histórico será mantido mas ele não aparecerá em novos lançamentos.')) {
                                                deleteCard(card.id!);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
