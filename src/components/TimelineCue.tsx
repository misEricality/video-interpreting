import type { InterpretedCue } from '@/types';
import { formatTime } from '@/services/time';
import { buildBiliTimestampUrl } from '@/utils/url';
import { ExternalLink, Quote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface Props {
  cue: InterpretedCue;
  bvid: string;
}

export function TimelineCue({ cue, bvid }: Props) {
  const url = buildBiliTimestampUrl(bvid, cue.start);
  const noRelevance = cue.relevance === '未涉及';

  return (
    <div className="relative pl-4 sm:pl-0">
      {/* PC 时间线布局 */}
      <div className="sm:flex sm:gap-4">
        <div className="hidden sm:flex sm:flex-col sm:items-end sm:w-28 sm:shrink-0 pt-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex flex-col items-end gap-0.5 hover:opacity-80"
            title="在 B 站打开此片段"
          >
            <span className="font-mono text-sm font-semibold text-brand-500 tabular-nums">
              {formatTime(cue.start, { alwaysHours: cue.start >= 3600 })}
            </span>
            <span className="font-mono text-xs text-[var(--ink-subtle)] tabular-nums">
              ~ {formatTime(cue.end, { alwaysHours: cue.end >= 3600 })}
            </span>
            <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-[var(--ink-subtle)] group-hover:text-brand-500">
              <ExternalLink className="h-2.5 w-2.5" />
              跳转 B 站
            </span>
          </a>
        </div>
        <div className="flex-1 min-w-0 pb-1">
          {/* 移动端时间徽章 */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 text-xs font-mono mb-1.5"
          >
            {formatTime(cue.start)} - {formatTime(cue.end)}
            <ExternalLink className="h-3 w-3" />
          </a>
          {cue.quote && (
            <div className="flex gap-2 px-3 py-2 rounded-lg bg-[var(--bg-soft)] border-l-2 border-brand-500/60 mb-2">
              <Quote className="h-3.5 w-3.5 text-brand-500/70 mt-1 shrink-0" />
              <p className="text-sm text-[var(--ink-muted)] italic leading-relaxed">
                {cue.quote}
              </p>
            </div>
          )}
          {cue.takeaway && (
            <div className="prose-app text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {cue.takeaway}
              </ReactMarkdown>
            </div>
          )}
          {cue.relevance && (
            <p className={`mt-1.5 text-xs ${noRelevance ? 'text-[var(--ink-subtle)]' : 'text-[var(--accent-ink)]'}`}>
              <span className="font-medium">{noRelevance ? '与关注点: ' : '关联: '}</span>
              {cue.relevance}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}