"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function Modal({ open, onOpenChange, title, children }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white/95 p-5 shadow-2xl backdrop-blur-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[34rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
            <Dialog.Close className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">{title}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
