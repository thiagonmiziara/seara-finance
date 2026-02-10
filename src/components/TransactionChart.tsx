import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TransactionChartProps {
    transactions: Transaction[];
}

export function TransactionChart({ transactions }: TransactionChartProps) {
    const data = useMemo(() => {
        // Group by month
        const grouped = transactions.reduce((acc, t) => {
            const month = format(parseISO(t.date), "MMM", { locale: ptBR });
            if (!acc[month]) {
                acc[month] = { name: month, receita: 0, despesa: 0 };
            }
            if (t.type === "income") {
                acc[month].receita += t.amount;
            } else {
                acc[month].despesa += t.amount;
            }
            return acc;
        }, {} as Record<string, { name: string; receita: number; despesa: number }>);

        // Convert to array and sort (mock sorting by month name for simplicity or just use order of appearance if needed)
        // For a real app we'd sort by date properly. Here assuming simplified view.
        return Object.values(grouped);
    }, [transactions]);

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Fluxo Mensal</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[250px] sm:h-[300px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `R$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #333", borderRadius: "8px" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Bar dataKey="receita" fill="#9AEC4C" radius={[4, 4, 0, 0]} name="Receita" />
                                <Bar dataKey="despesa" fill="#ff4d4d" radius={[4, 4, 0, 0]} name="Despesa" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Sem dados para exibir
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
