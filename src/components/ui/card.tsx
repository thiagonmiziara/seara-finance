import { twMerge } from 'tailwind-merge'
import type { ComponentProps } from 'react'

export interface CardProps extends ComponentProps<'div'> {}

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            data-slot="card"
            className={twMerge('bg-card rounded-lg border border-border p-6 shadow-sm', className)}
            {...props}
        />
    )
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-header"
            className={twMerge('flex flex-col space-y-1.5', className)}
            {...props}
        />
    )
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
    return (
        <h3
            data-slot="card-title"
            className={twMerge('text-2xl font-semibold leading-none tracking-tight', className)}
            {...props}
        />
    )
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
    return (
        <p
            data-slot="card-description"
            className={twMerge('text-sm text-muted-foreground', className)}
            {...props}
        />
    )
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-content"
            className={twMerge('p-6 pt-0', className)}
            {...props}
        />
    )
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-footer"
            className={twMerge('flex items-center p-6 pt-0', className)}
            {...props}
        />
    )
}
