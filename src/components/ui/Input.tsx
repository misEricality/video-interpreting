import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { prefix, suffix, className, ...rest },
  ref
) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-3 h-11 rounded-xl',
        'bg-[var(--bg-soft)] border border-[var(--border)]',
        'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20',
        'transition-colors',
        className
      )}
    >
      {prefix && <span className="text-[var(--ink-subtle)] shrink-0">{prefix}</span>}
      <input
        ref={ref}
        className={clsx(
          'flex-1 min-w-0 bg-transparent outline-none text-[var(--ink)] placeholder:text-[var(--ink-subtle)]'
        )}
        {...rest}
      />
      {suffix && <span className="text-[var(--ink-subtle)] shrink-0">{suffix}</span>}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'w-full px-3 py-2.5 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]',
        'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-colors resize-y',
        'text-[var(--ink)] placeholder:text-[var(--ink-subtle)]',
        className
      )}
      {...rest}
    />
  );
});