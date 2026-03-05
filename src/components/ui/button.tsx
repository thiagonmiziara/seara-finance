import { tv, type VariantProps } from 'tailwind-variants'
import { twMerge } from 'tailwind-merge'
import type { ComponentProps } from 'react'

export const buttonVariants = tv({
    base: [
        'inline-flex items-center justify-center cursor-pointer font-medium rounded-lg border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    ],
    variants: {
        variant: {
            default: 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover',
            destructive: 'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90',
            outline: 'border-border bg-background hover:bg-accent hover:text-accent-foreground',
            secondary: 'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
            ghost: 'border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground',
            link: 'border-transparent text-primary underline-offset-4 hover:underline',
        },
        size: {
            default: 'h-10 px-4 py-2 text-sm',
            sm: 'h-9 px-3 text-sm rounded-md',
            lg: 'h-11 px-8 text-base rounded-md',
            icon: 'h-10 w-10 p-0',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
})

export interface ButtonProps
    extends ComponentProps<'button'>,
        VariantProps<typeof buttonVariants> {}

export function Button({
    className,
    variant,
    size,
    disabled,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            type="button"
            data-slot="button"
            data-disabled={disabled ? '' : undefined}
            className={twMerge(buttonVariants({ variant, size }), className)}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    )
}
