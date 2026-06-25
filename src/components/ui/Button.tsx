import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-brand-700/40',
  secondary:
    'bg-[var(--bg-soft)] text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--border)] disabled:opacity-50',
  ghost:
    'bg-transparent text-[var(--ink)] hover:bg-[var(--bg-soft)] disabled:opacity-50',
  danger:
    'bg-[var(--danger)] text-white hover:opacity-90 disabled:opacity-50',
};

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-5 text-base rounded-xl gap-2',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, icon, block, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium select-none transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        'disabled:cursor-not-allowed',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        block && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});