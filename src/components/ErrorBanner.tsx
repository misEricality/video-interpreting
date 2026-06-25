import { AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  message: string;
  onClose?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onClose, className }: Props) {
  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-3 rounded-xl',
        'bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)]',
        'text-sm',
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 break-words">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-[var(--danger)]/10 shrink-0"
          aria-label="关闭"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}