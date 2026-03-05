import * as LabelPrimitive from '@radix-ui/react-label'
import { twMerge } from 'tailwind-merge'
import type { ComponentProps } from 'react'

export interface LabelProps extends ComponentProps<typeof LabelPrimitive.Root> {}

export function Label({ className, ...props }: LabelProps) {
    return (
        <LabelPrimitive.Root
            data-slot="label"
            className={twMerge('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}
            {...props}
        />
    )
}
