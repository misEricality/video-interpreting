import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'prefix'> {
  prefix?: ReactNode;
  suffix?: ReactNode;
}

/**
 * 原生 <select> 包装 — 跟 Input 视觉风格一致。
 * 选项通过 children 传入(标准 <option> 元素即可)。
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { prefix, suffix, className, children, ...rest },
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
      <select
        ref={ref}
        className={clsx(
          'flex-1 min-w-0 bg-transparent outline-none appearance-none cursor-pointer',
          'text-[var(--ink)] [&>option]:bg-[var(--bg)]'
        )}
        {...rest}
      >
        {children}
      </select>
      {suffix ?? (
        <ChevronDown className="h-4 w-4 text-[var(--ink-subtle)] shrink-0 pointer-events-none" />
      )}
    </div>
  );
});
