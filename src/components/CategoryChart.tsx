import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types";
import { useMemo } from "react";

interface CategoryChartProps {
    transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export function CategoryChart({ transactions }: CategoryChartProps) {
    const data = useMemo(() => {
        const categories = transactions.reduce((acc, t) => {
            if (!acc[t.category]) {
                acc[t.category] = 0;
            }
            acc[t.category] += t.amount;
            return acc;
        }, {} as Record<string, number>);

        const total = Object.values(categories).reduce((sum, val) => sum + val, 0);

        return Object.entries(categories).map(([name, value]) => ({
            name,
            value,
            percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
        })).sort((a, b) => b.value - a.value);
    }, [transactions]);

    return (
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, name: string, props: any) => {
                                        return [`R$ ${value.toFixed(2)} (${props.payload.percentage}%)`, name];
                                    }}
                                    contentStyle={{ backgroundColor: "#1A1A1A", border: "1px solid #333", borderRadius: "8px" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Legend />
                            </PieChart>
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
