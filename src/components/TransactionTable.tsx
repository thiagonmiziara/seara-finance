import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/utils/date"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Transaction } from "@/types"

interface TransactionTableProps {
    data: Transaction[]
    onDelete: (id: string) => void
    isDeleting?: boolean
}

export function TransactionTable({ data, onDelete, isDeleting }: TransactionTableProps) {
    const [deletingId, setDeletingId] = React.useState<string | null>(null)
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const columns: ColumnDef<Transaction>[] = [
        {
            accessorKey: "description",
            header: "Descrição",
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("description")}</div>
            ),
        },
        {
            accessorKey: "amount",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Valor
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("amount"))
                const formatted = new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                }).format(amount)

                const type = row.original.type

                return <div className={type === 'income' ? 'text-primary' : 'text-destructive font-bold'}>{type === 'expense' ? '-' : ''}{formatted}</div>
            },
        },
        {
            accessorKey: "category",
            header: "Categoria",
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("category")}</div>
            ),
        },
        {
            accessorKey: "type",
            header: "Tipo",
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue("type") === 'income' ? 'Entrada' : 'Saída'}</div>
            ),
        },
        {
            id: "situation",
            header: "Situação",
            cell: ({ row }) => {
                const status = row.original.status
                const date = row.original.date
                const formattedDate = formatDate(date)

                const statusConfig: Record<string, { label: string, color: string }> = {
                    pago: { label: "Pago", color: "text-primary" },
                    a_pagar: { label: "A Pagar", color: "text-destructive font-bold" },
                    recebido: { label: "Recebido", color: "text-primary" },
                    a_receber: { label: "A Receber", color: "text-orange-500 font-medium" },
                };

                const { label, color } = statusConfig[status as keyof typeof statusConfig] || { label: status, color: "" };

                return (
                    <div className="flex flex-col">
                        <span className={color}>
                            {label}
                        </span>
                        <span className="text-xs text-muted-foreground">{formattedDate}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: "createdAt",
            header: "Data do Cadastro",
            cell: ({ row }) => (
                <div className="capitalize">{formatDate(row.getValue("createdAt"))}</div>
            ),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const transaction = row.original

                return (
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={async () => {
                            setDeletingId(transaction.id)
                            await onDelete(transaction.id)
                            setDeletingId(null)
                        }}
                        disabled={isDeleting && deletingId === transaction.id}
                    >
                        <span className="sr-only">Delete</span>
                        <Trash className={`h-4 w-4 text-destructive ${isDeleting && deletingId === transaction.id ? 'animate-pulse opacity-50' : ''}`} />
                    </Button>
                )
            },
        },
    ]

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filtrar transações..."
                    value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("description")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4 mb-4">
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => {
                        const transaction = row.original
                        const amount = parseFloat(row.getValue("amount"))
                        const formattedAmount = new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        }).format(amount)

                        const status = transaction.status
                        const date = transaction.date
                        const formattedDate = formatDate(date)

                        const statusConfig: Record<string, { label: string, color: string, bg: string }> = {
                            pago: { label: "Pago", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                            a_pagar: { label: "A Pagar", color: "text-rose-500", bg: "bg-rose-500/10" },
                            recebido: { label: "Recebido", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                            a_receber: { label: "A Receber", color: "text-amber-500", bg: "bg-amber-500/10" },
                        };

                        const { label, color, bg } = statusConfig[status as keyof typeof statusConfig] || { label: status, color: "", bg: "" };

                        return (
                            <div key={row.id} className="bg-card border border-border/50 rounded-xl p-4 shadow-sm space-y-3 relative overflow-hidden group transition-all hover:border-primary/30">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{transaction.description}</h4>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{transaction.category}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        onClick={async () => {
                                            setDeletingId(transaction.id)
                                            await onDelete(transaction.id)
                                            setDeletingId(null)
                                        }}
                                        disabled={isDeleting && deletingId === transaction.id}
                                    >
                                        <Trash className={`h-4 w-4 ${isDeleting && deletingId === transaction.id ? 'animate-pulse' : ''}`} />
                                    </Button>
                                </div>

                                <div className="flex items-end justify-between pt-1">
                                    <div className="space-y-1">
                                        <div className={`text-xl font-bold tracking-tight ${transaction.type === 'income' ? 'text-primary' : 'text-rose-500'}`}>
                                            {transaction.type === 'expense' ? '-' : ''}{formattedAmount}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium">{formattedDate}</p>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full ${bg} ${color} text-[10px] font-bold uppercase tracking-wider border border-current/10`}>
                                        {label}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="bg-card border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                        Sem resultados para o filtro.
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        Sem resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Próximo
                    </Button>
                </div>
            </div>
        </div>
    )
}
