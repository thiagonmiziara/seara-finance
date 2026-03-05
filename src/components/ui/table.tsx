import { twMerge } from 'tailwind-merge'
import type { ComponentProps } from 'react'

export interface TableProps extends ComponentProps<'table'> {}

export function Table({ className, ...props }: TableProps) {
    return (
        <div className='relative w-full overflow-auto'>
            <table
                data-slot="table"
                className={twMerge('w-full caption-bottom text-sm', className)}
                {...props}
            />
        </div>
    )
}

export interface TableHeaderProps extends ComponentProps<'thead'> {}

export function TableHeader({ className, ...props }: TableHeaderProps) {
    return (
        <thead
            data-slot="table-header"
            className={twMerge('[&_tr]:border-b', className)}
            {...props}
        />
    )
}

export interface TableBodyProps extends ComponentProps<'tbody'> {}

export function TableBody({ className, ...props }: TableBodyProps) {
    return (
        <tbody
            data-slot="table-body"
            className={twMerge('[&_tr:last-child]:border-0', className)}
            {...props}
        />
    )
}

export interface TableFooterProps extends ComponentProps<'tfoot'> {}

export function TableFooter({ className, ...props }: TableFooterProps) {
    return (
        <tfoot
            data-slot="table-footer"
            className={twMerge(
                'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
                className
            )}
            {...props}
        />
    )
}

export interface TableRowProps extends ComponentProps<'tr'> {}

export function TableRow({ className, ...props }: TableRowProps) {
    return (
        <tr
            data-slot="table-row"
            className={twMerge(
                'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
                className
            )}
            {...props}
        />
    )
}

export interface TableHeadProps extends ComponentProps<'th'> {}

export function TableHead({ className, ...props }: TableHeadProps) {
    return (
        <th
            data-slot="table-head"
            className={twMerge(
                'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
                className
            )}
            {...props}
        />
    )
}

export interface TableCellProps extends ComponentProps<'td'> {}

export function TableCell({ className, ...props }: TableCellProps) {
    return (
        <td
            data-slot="table-cell"
            className={twMerge('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
            {...props}
        />
    )
}

export interface TableCaptionProps extends ComponentProps<'caption'> {}

export function TableCaption({ className, ...props }: TableCaptionProps) {
    return (
        <caption
            data-slot="table-caption"
            className={twMerge('mt-4 text-sm text-muted-foreground', className)}
            {...props}
        />
    )
}
