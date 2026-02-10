import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TransactionFormValues, transactionFormSchema } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"

interface AddTransactionModalProps {
    onAddTransaction: (data: TransactionFormValues) => void
    className?: string
}

export function AddTransactionModal({ onAddTransaction, className }: AddTransactionModalProps) {
    const [open, setOpen] = useState(false)
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionFormSchema),
        defaultValues: {
            type: 'expense',
            amount: 0,
            description: '',
            category: ''
        }
    })

    const onSubmit = (data: TransactionFormValues) => {
        onAddTransaction(data)
        setOpen(false)
        reset()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className={className}>Nova Transação</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Transação</DialogTitle>
                    <DialogDescription>
                        Insira os detalhes da nova transação aqui. Clique em salvar quando terminar.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Descrição
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="description"
                                    className="col-span-3"
                                    {...register("description")}
                                />
                                {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Valor
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    className="col-span-3"
                                    {...register("amount", { valueAsNumber: true })}
                                />
                                {errors.amount && <span className="text-red-500 text-xs">{errors.amount.message}</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Categoria
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="category"
                                    className="col-span-3"
                                    {...register("category")}
                                />
                                {errors.category && <span className="text-red-500 text-xs">{errors.category.message}</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Tipo
                            </Label>
                            <div className="col-span-3">
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="income">Entrada</SelectItem>
                                                <SelectItem value="expense">Saída</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.type && <span className="text-red-500 text-xs">{errors.type.message}</span>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Salvar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
