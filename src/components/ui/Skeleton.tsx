import clsx from 'clsx';

interface Props {
  className?: string;
}

export function Skeleton({ className }: Props) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-md bg-[var(--bg-soft)]',
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3, lastShort = true }: { lines?: number; lastShort?: boolean }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={i === lines - 1 && lastShort ? 'h-4 w-2/3' : 'h-4'}
        />
      ))}
    </div>
  );
}