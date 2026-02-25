import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Debt } from '@/types';
import { useMemo } from 'react';

interface DebtProgressChartProps {
    debts: Debt[];
}

export function DebtProgressChart({ debts }: DebtProgressChartProps) {
    const data = useMemo(() => {
        return debts
            .map((debt) => {
                const paidInstallments = debt.status === 'pago' ? debt.installments : (debt.paidInstallments || 0);
                const paidAmount = paidInstallments * debt.installmentAmount;
                const remainingAmount = debt.totalAmount - paidAmount;

                return {
                    name: debt.description.length > 15 ? debt.description.substring(0, 15) + '...' : debt.description,
                    fullName: debt.description,
                    pago: paidAmount,
                    restante: Math.max(0, remainingAmount),
                };
            })
            .sort((a, b) => (b.pago + b.restante) - (a.pago + a.restante))
            .slice(0, 5); // top 5 debts
    }, [debts]);

    return (
        <Card className='col-span-4 lg:col-span-5'>
            <CardHeader>
                <CardTitle>Top 5 Dívidas</CardTitle>
            </CardHeader>
            <CardContent className='pl-2'>
                <div className='h-[300px] w-full'>
                    {data.length > 0 ? (
                        <ResponsiveContainer width='100%' height='100%'>
                            <BarChart data={data}>
                                <CartesianGrid
                                    strokeDasharray='3 3'
                                    stroke='hsl(var(--chart-grid))'
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey='name'
                                    stroke='#888888'
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke='#888888'
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `R$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value: any, name: any) => {
                                        const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                                        return [formattedValue, name === 'pago' ? 'Valor Pago' : 'Valor Restante'];
                                    }}
                                    labelFormatter={(label: any, payload: any[]) => {
                                        if (payload && payload.length > 0) {
                                            return payload[0].payload.fullName;
                                        }
                                        return label;
                                    }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--chart-tooltip-bg))',
                                        border: '1px solid hsl(var(--chart-tooltip-border))',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                    itemStyle={{ color: 'hsl(var(--chart-tooltip-text))' }}
                                />
                                <Legend />
                                <Bar
                                    dataKey='pago'
                                    stackId="a"
                                    fill='#10b981' // emerald-500
                                    name='Valor Pago'
                                    radius={[0, 0, 4, 4]}
                                />
                                <Bar
                                    dataKey='restante'
                                    stackId="a"
                                    fill='#f87171' // red-400
                                    name='Valor Restante'
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className='flex h-full items-center justify-center text-muted-foreground'>
                            Sem dados para exibir
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
