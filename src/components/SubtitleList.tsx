import { useState } from 'react';
import type { SubtitleCue } from '@/types';
import { formatTime } from '@/services/time';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  cues: SubtitleCue[];
}

export function SubtitleList({ cues }: Props) {
  const [open, setOpen] = useState(false);

  if (!cues.length) return null;

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/40 overflow-hidden"
    >
      <summary className="cursor-pointer select-none px-4 py-3 flex items-center gap-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--bg-soft)] transition-colors">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        原始字幕
        <span className="text-xs text-[var(--ink-subtle)] font-normal">
          (共 {cues.length} 条)
        </span>
      </summary>
      <div className="max-h-96 overflow-y-auto scrollbar-thin border-t border-[var(--border)]">
        <ul className="divide-y divide-[var(--border)]">
          {cues.map((cue) => (
            <li key={cue.sid} className="px-4 py-2.5 flex gap-3 text-sm">
              <span className="font-mono text-xs text-[var(--ink-subtle)] tabular-nums shrink-0 pt-0.5 w-24">
                {formatTime(cue.from, { alwaysHours: cue.from >= 3600 })}
              </span>
              <span className="text-[var(--ink)] flex-1 min-w-0 leading-relaxed">
                {cue.content}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}