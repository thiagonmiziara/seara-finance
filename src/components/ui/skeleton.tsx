import { twMerge } from 'tailwind-merge'
import type { ComponentProps } from 'react'

export interface SkeletonProps extends ComponentProps<'div'> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            data-slot="skeleton"
            className={twMerge('animate-pulse rounded-md bg-muted', className)}
            {...props}
        />
    )
}
