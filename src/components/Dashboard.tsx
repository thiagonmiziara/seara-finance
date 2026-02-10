import { AddTransactionModal } from "@/components/AddTransactionModal";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionChart } from "@/components/TransactionChart";
import { TransactionTable } from "@/components/TransactionTable";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFinance } from "@/hooks/useFinance";
import { Download, LogOut } from "lucide-react";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { transactions, addTransaction, removeTransaction, summary, exportToCSV } = useFinance();

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
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 border-zinc-200 dark:border-zinc-800 transition-colors"
                            onClick={exportToCSV}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            <span className="truncate">Exportar CSV</span>
                        </Button>
                        <AddTransactionModal onAddTransaction={addTransaction} className="w-full sm:w-auto" />
                    </div>
                </div>

                <SummaryCards summary={summary} />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <TransactionChart transactions={transactions} />
                    <div className="col-span-4 lg:col-span-3">
                        {/* Placeholder for another chart or recent activity if needed. 
                 For now, the chart takes 4 cols and maybe we can make it full width or add something else.
                 The layout requested had: Cards, Chart, Table.
                 Let's make the chart full width on mobile, and part of grid on desktop.
                 Actually, the prompt said "Gráfico de barras ... para mostrar o fluxo mensal".
                 Let's make the chart 4 columns and maybe put something else next to it or just make it occupy a good chunk.
                 Wait, the design usually has the chart prominent.
             */}
                    </div>
                </div>
                {/* Adjusted grid above: The chart is set to col-span-4. If we want it full width we can change it. 
            Let's make it full width for better visibility as there is no specific "recent transactions" widget mentioned aside from the table.
        */}
                <div className="grid gap-4 md:grid-cols-1">
                    <TransactionChart transactions={transactions} />
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold tracking-tight">Transações</h3>
                    <TransactionTable data={transactions} onDelete={removeTransaction} />
                </div>
            </main>
        </div>
    );
}
