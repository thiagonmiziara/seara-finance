import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { twMerge } from 'tailwind-merge'
import { Check, ChevronRight, Circle } from 'lucide-react'
import type { ComponentProps } from 'react'

export const DropdownMenu = DropdownMenuPrimitive.Root

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export const DropdownMenuGroup = DropdownMenuPrimitive.Group

export const DropdownMenuPortal = DropdownMenuPrimitive.Portal

export const DropdownMenuSub = DropdownMenuPrimitive.Sub

export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

export interface DropdownMenuSubTriggerProps
    extends ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> {
    inset?: boolean
}

export function DropdownMenuSubTrigger({ className, inset, children, ...props }: DropdownMenuSubTriggerProps) {
    return (
        <DropdownMenuPrimitive.SubTrigger
            data-slot="dropdown-menu-sub-trigger"
            className={twMerge(
                'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
                inset && 'pl-8',
                className
            )}
            {...props}
        >
            {children}
            <ChevronRight className='ml-auto h-4 w-4' />
        </DropdownMenuPrimitive.SubTrigger>
    )
}

export interface DropdownMenuSubContentProps extends ComponentProps<typeof DropdownMenuPrimitive.SubContent> {}

export function DropdownMenuSubContent({ className, ...props }: DropdownMenuSubContentProps) {
    return (
        <DropdownMenuPrimitive.SubContent
            data-slot="dropdown-menu-sub-content"
            className={twMerge(
                'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                className
            )}
            {...props}
        />
    )
}

export interface DropdownMenuContentProps extends ComponentProps<typeof DropdownMenuPrimitive.Content> {}

export function DropdownMenuContent({ className, sideOffset = 4, ...props }: DropdownMenuContentProps) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                data-slot="dropdown-menu-content"
                sideOffset={sideOffset}
                className={twMerge(
                    'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    className
                )}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    )
}

export interface DropdownMenuItemProps extends ComponentProps<typeof DropdownMenuPrimitive.Item> {
    inset?: boolean
}

export function DropdownMenuItem({ className, inset, ...props }: DropdownMenuItemProps) {
    return (
        <DropdownMenuPrimitive.Item
            data-slot="dropdown-menu-item"
            className={twMerge(
                'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                inset && 'pl-8',
                className
            )}
            {...props}
        />
    )
}

export interface DropdownMenuCheckboxItemProps extends ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> {}

export function DropdownMenuCheckboxItem({ className, children, checked, ...props }: DropdownMenuCheckboxItemProps) {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            data-slot="dropdown-menu-checkbox-item"
            className={twMerge(
                'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className
            )}
            checked={checked}
            {...props}
        >
            <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
                <DropdownMenuPrimitive.ItemIndicator>
                    <Check className='h-4 w-4' />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    )
}

export interface DropdownMenuRadioItemProps extends ComponentProps<typeof DropdownMenuPrimitive.RadioItem> {}

export function DropdownMenuRadioItem({ className, children, ...props }: DropdownMenuRadioItemProps) {
    return (
        <DropdownMenuPrimitive.RadioItem
            data-slot="dropdown-menu-radio-item"
            className={twMerge(
                'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                className
            )}
            {...props}
        >
            <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
                <DropdownMenuPrimitive.ItemIndicator>
                    <Circle className='h-2 w-2 fill-current' />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    )
}

export interface DropdownMenuLabelProps extends ComponentProps<typeof DropdownMenuPrimitive.Label> {
    inset?: boolean
}

export function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps) {
    return (
        <DropdownMenuPrimitive.Label
            data-slot="dropdown-menu-label"
            className={twMerge(
                'px-2 py-1.5 text-sm font-semibold',
                inset && 'pl-8',
                className
            )}
            {...props}
        />
    )
}

export interface DropdownMenuSeparatorProps extends ComponentProps<typeof DropdownMenuPrimitive.Separator> {}

export function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
    return (
        <DropdownMenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={twMerge('-mx-1 my-1 h-px bg-muted', className)}
            {...props}
        />
    )
}

export interface DropdownMenuShortcutProps extends ComponentProps<'span'> {}

export function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps) {
    return (
        <span
            data-slot="dropdown-menu-shortcut"
            className={twMerge('ml-auto text-xs tracking-widest opacity-60', className)}
            {...props}
        />
    )
}
