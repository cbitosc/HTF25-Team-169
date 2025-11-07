'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'

import { cn } from '@/lib/utils'

function Drawer({ ...props }: React.ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props} />
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof Dialog.Portal>) {
  return <Dialog.Portal {...props} />
}

function DrawerClose({ ...props }: React.ComponentProps<typeof Dialog.Close>) {
  return <Dialog.Close {...props} />
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof Dialog.Overlay>) {
  return (
    <Dialog.Overlay
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof Dialog.Content>) {
  // This Drawer is implemented using Radix Dialog. It renders a right-side
  // sliding panel by default. If you need other directions, we can extend
  // the API later.
  return (
    <Dialog.Portal>
      <DrawerOverlay />
      <Dialog.Content
        className={cn(
          'group/drawer-content bg-background fixed right-0 top-0 z-50 flex h-full w-3/4 sm:w-96 flex-col shadow-lg',
          className,
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full" />
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex flex-col gap-0.5 p-4 md:gap-1.5 md:text-left', className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title data-slot="drawer-title" className={cn('text-foreground font-semibold', className)} {...props} />
  )
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description data-slot="drawer-description" className={cn('text-muted-foreground text-sm', className)} {...props} />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
