import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths, format, startOfDay, endOfDay } from "date-fns";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { CategoryChart } from "@/components/CategoryChart";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionChart } from "@/components/TransactionChart";
import { TransactionTable } from "@/components/TransactionTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFinance } from "@/hooks/useFinance";
import { Download, LogOut } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [period, setPeriod] = useState<"current" | "previous" | "custom">("current");
    const [customRange, setCustomRange] = useState({
        from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        to: format(new Date(), "yyyy-MM-dd"),
    });

    const dateRange = useMemo(() => {
        const now = new Date();
        if (period === "current") {
            return { from: startOfMonth(now), to: endOfDay(now) };
        }
        if (period === "previous") {
            const prev = subMonths(now, 1);
            return { from: startOfMonth(prev), to: endOfMonth(prev) };
        }
        return {
            from: startOfDay(new Date(customRange.from + "T00:00:00")),
            to: endOfDay(new Date(customRange.to + "T23:59:59"))
        };
    }, [period, customRange]);

    const {
        transactions,
        addTransaction,
        removeTransaction,
        summary,
        exportToCSV,
        isAdding,
        isDeleting,
        isInitialLoading
    } = useFinance(dateRange);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b bg-card">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20">
                            <span className="font-bold text-sm">SF</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">Seara Finance</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground hidden md:inline-block">Olá, {user?.name}</span>
                            {user?.avatar && <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />}
                        </div>
                        <Button variant="ghost" size="icon" onClick={logout}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto flex-1 space-y-8 p-4 py-8 md:p-8">
                <div className="flex flex-col space-y-6 md:flex-row md:items-end md:justify-between md:space-y-0 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
                    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0 w-full lg:w-auto">
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Período</label>
                            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                                <SelectTrigger className="w-full bg-background/50 border-border/50 focus:ring-primary/20">
                                    <SelectValue placeholder="Selecione o período" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="current">Mês Atual</SelectItem>
                                    <SelectItem value="previous">Mês Anterior</SelectItem>
                                    <SelectItem value="custom">Personalizado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {period === "custom" && (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 animate-in fade-in slide-in-from-left-4 duration-300 w-full lg:w-auto">
                                <div className="space-y-1.5 flex-1 sm:flex-none">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1 block">Início</label>
                                    <Input
                                        type="date"
                                        value={customRange.from}
                                        onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
                                        className="bg-background/50 border-border/50 focus:ring-primary/20 h-10"
                                    />
                                </div>
                                <div className="hidden sm:block pt-6 text-muted-foreground font-medium text-xs">até</div>
                                <div className="space-y-1.5 flex-1 sm:flex-none">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1 block">Fim</label>
                                    <Input
                                        type="date"
                                        value={customRange.to}
                                        onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
                                        className="bg-background/50 border-border/50 focus:ring-primary/20 h-10"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0 mt-4 md:mt-0">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 border-border/50 transition-colors bg-background/50"
                            onClick={exportToCSV}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            <span className="truncate">Exportar CSV</span>
                        </Button>
                        <AddTransactionModal onAddTransaction={addTransaction} isAdding={isAdding} className="w-full sm:w-auto" />
                    </div>
                </div>

                <div className="flex flex-col space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Resumo Financeiro</h2>
                    <p className="text-muted-foreground">
                        Visualização completa do seu fluxo no período selecionado.
                    </p>
                </div>

                {isInitialLoading ? (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Skeleton className="h-[120px]" />
                        <Skeleton className="h-[120px]" />
                        <Skeleton className="h-[120px]" />
                    </div>
                ) : (
                    <SummaryCards summary={summary} />
                )}

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {isInitialLoading ? (
                        <>
                            <Skeleton className="col-span-4 h-[350px]" />
                            <Skeleton className="col-span-3 h-[350px]" />
                        </>
                    ) : (
                        <>
                            <TransactionChart transactions={transactions} />
                            <CategoryChart transactions={transactions} />
                        </>
                    )}
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold tracking-tight">Transações</h3>
                    {isInitialLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-[50px] w-full" />
                            <Skeleton className="h-[200px] w-full" />
                        </div>
                    ) : (
                        <TransactionTable data={transactions} onDelete={removeTransaction} isDeleting={isDeleting} />
                    )}
                </div>
            </main>
        </div>
    );
}
