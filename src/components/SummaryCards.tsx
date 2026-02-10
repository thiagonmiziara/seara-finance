import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
    summary: {
        income: number;
        expense: number;
        balance: number;
    };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:border-primary/50 transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", summary.balance >= 0 ? "text-primary" : "text-destructive")}>
                        {formatCurrency(summary.balance)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {summary.balance >= 0 ? "+R$ 0,00" : "-R$ 0,00"} do mês passado (mock)
                    </p>
                </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">
                        {formatCurrency(summary.income)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Total de entradas
                    </p>
                </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                        {formatCurrency(summary.expense)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Total de saídas
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
