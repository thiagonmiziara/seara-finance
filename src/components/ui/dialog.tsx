import * as DialogPrimitive from '@radix-ui/react-dialog'
import { twMerge } from 'tailwind-merge'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'

export const Dialog = DialogPrimitive.Root

export const DialogTrigger = DialogPrimitive.Trigger

export const DialogPortal = DialogPrimitive.Portal

export const DialogClose = DialogPrimitive.Close

export interface DialogOverlayProps extends ComponentProps<typeof DialogPrimitive.Overlay> {}

export function DialogOverlay({ className, ...props }: DialogOverlayProps) {
    return (
        <DialogPrimitive.Overlay
            data-slot="dialog-overlay"
            className={twMerge(
                'fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                className,
            )}
            {...props}
        />
    )
}

export interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                data-slot="dialog-content"
                className={twMerge(
                    'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
                    className,
                )}
                {...props}
            >
                {children}
                <DialogPrimitive.Close
                    data-slot="dialog-close-button"
                    className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'
                >
                    <X className='h-4 w-4' />
                    <span className='sr-only'>Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    )
}

export interface DialogHeaderProps extends ComponentProps<'div'> {}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
    return (
        <div
            data-slot="dialog-header"
            className={twMerge(
                'flex flex-col space-y-1.5 text-center sm:text-left',
                className,
            )}
            {...props}
        />
    )
}

export interface DialogFooterProps extends ComponentProps<'div'> {}

export function DialogFooter({ className, ...props }: DialogFooterProps) {
    return (
        <div
            data-slot="dialog-footer"
            className={twMerge(
                'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
                className,
            )}
            {...props}
        />
    )
}

export interface DialogTitleProps extends ComponentProps<typeof DialogPrimitive.Title> {}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={twMerge(
                'text-lg font-semibold leading-none tracking-tight',
                className,
            )}
            {...props}
        />
    )
}

export interface DialogDescriptionProps extends ComponentProps<typeof DialogPrimitive.Description> {}

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={twMerge('text-sm text-muted-foreground', className)}
            {...props}
        />
    )
}
