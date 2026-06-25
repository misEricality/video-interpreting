import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: 'right' | 'left';
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  side = 'right',
  children,
  footer,
  width = 'w-full sm:max-w-md',
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={clsx(
            'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm',
            'data-[state=open]:animate-fade-in'
          )}
        />
        <Dialog.Content
          className={clsx(
            'fixed top-0 bottom-0 z-50 flex flex-col',
            'bg-[var(--bg-elevated)] shadow-soft-lg',
            side === 'right'
              ? 'right-0 border-l border-[var(--border)] data-[state=open]:animate-slide-in-right'
              : 'left-0 border-r border-[var(--border)] data-[state=open]:animate-slide-in-left',
            width
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--border)]">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-[var(--ink)] truncate">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-xs text-[var(--ink-muted)] mt-0.5">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--ink)] transition-colors"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-5 py-4">
            {children}
          </div>

          {footer && (
            <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-soft)]">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}