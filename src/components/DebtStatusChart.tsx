import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

interface DebtStatusChartProps {
    summary: {
        total: number;
        paid: number;
        remaining: number;
    };
}

export function DebtStatusChart({ summary }: DebtStatusChartProps) {
    const data = useMemo(() => {
        return [
            {
                name: 'Pago',
                value: summary.paid,
                color: '#10b981', // emerald-500
            },
            {
                name: 'A Pagar',
                value: summary.remaining,
                color: '#f87171', // red-400
            },
        ].filter(item => item.value > 0);
    }, [summary]);

    return (
        <Card className='col-span-4 lg:col-span-3'>
            <CardHeader>
                <CardTitle>Status das Dívidas</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='h-[300px] w-full'>
                    {data.length > 0 ? (
                        <ResponsiveContainer width='100%' height='100%'>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx='50%'
                                    cy='50%'
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey='value'
                                    nameKey='name'
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => {
                                        return [
                                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                                            '',
                                        ];
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
                            </PieChart>
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
