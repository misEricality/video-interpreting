import { useAppStore } from '@/store/useAppStore';
import { TimelineCue } from './TimelineCue';
import { SubtitleList } from './SubtitleList';
import { ChatPanel } from './ChatPanel';
import { formatDuration, formatTime } from '@/services/time';
import { ExternalLink, Sparkles, Clock, FileText, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { EmptyState } from './EmptyState';
import { SkeletonText } from './ui/Skeleton';
import { useState } from 'react';

export function ResultView() {
  const current = useAppStore((s) => s.current);
  const loading = useAppStore((s) => s.loading);

  if (!current && loading.stage === 'idle') {
    return <EmptyState />;
  }

  if (!current) {
    return (
      <div className="space-y-4">
        <SkeletonText lines={2} />
        <SkeletonText lines={5} />
        <SkeletonText lines={3} />
      </div>
    );
  }

  const { videoMeta, bvid, url, focus, summary, cues, subtitles, aiSubtitle, rawAiResponse } = current;
  const isInterpreting = loading.stage === 'interpreting' || loading.stage === 'streaming';
  const isParseError = !!rawAiResponse;

  return (
    <div className="space-y-5">
      {/* 视频信息条 */}
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-brand-500/5 via-[var(--bg-elevated)] to-[var(--bg-elevated)] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold text-[var(--ink)] leading-snug">
                {videoMeta.title || bvid}
              </h2>
              {aiSubtitle && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  AI 字幕
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--ink-muted)] flex-wrap">
              {videoMeta.duration > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(videoMeta.duration)}
                </span>
              )}
              {focus && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span className="line-clamp-1 max-w-[200px] sm:max-w-md">{focus}</span>
                </span>
              )}
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            在 B 站打开
          </a>
        </div>
      </div>

      {/* Summary */}
      {(summary || isInterpreting) && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--ink)]">视频主要内容</h3>
            {isInterpreting && !summary && (
              <span className="text-xs text-[var(--ink-subtle)]">生成中...</span>
            )}
          </div>
          {summary ? (
            <div className="prose-app text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {summary}
              </ReactMarkdown>
            </div>
          ) : (
            <SkeletonText lines={4} />
          )}
        </section>
      )}

      {/* Cues Timeline */}
      {(cues.length > 0 || isInterpreting) && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 text-brand-500" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              关注点相关片段
              {cues.length > 0 && (
                <span className="text-xs text-[var(--ink-subtle)] font-normal ml-1.5">
                  ({cues.length} 条)
                </span>
              )}
            </h3>
          </div>
          {cues.length > 0 ? (
            <ol className="space-y-5 relative">
              {/* 时间线左侧竖线 */}
              <div
                aria-hidden
                className="hidden sm:block absolute left-[112px] top-2 bottom-2 w-px bg-gradient-to-b from-brand-500/40 via-brand-500/20 to-transparent"
              />
              {cues.map((cue, i) => (
                <li key={`${cue.start}-${i}`} className="relative">
                  <TimelineCue cue={cue} bvid={bvid} />
                </li>
              ))}
            </ol>
          ) : (
            !isInterpreting && (
              <p className="text-sm text-[var(--ink-subtle)]">
                视频中未发现与关注点相关的内容。
              </p>
            )
          )}
          {isInterpreting && cues.length === 0 && (
            <div className="space-y-3">
              <SkeletonText lines={2} />
              <SkeletonText lines={2} />
            </div>
          )}
        </section>
      )}

      {/* 原始字幕 */}
      {subtitles.length > 0 && (
        <SubtitleList cues={subtitles} />
      )}

      {/* 追问(Q&A)面板:解读完成后才显示 */}
      {!isInterpreting && (
        <ChatPanel />
      )}

      {/* AI 原始响应(解析失败时显示,便于调试) */}
      {isParseError && (
        <RawResponsePanel raw={rawAiResponse!} />
      )}
    </div>
  );
}

/**
 * 显示 AI 原始响应,带折叠/复制按钮。用于 JSON 解析失败时调试。
 */
function RawResponsePanel({ raw }: { raw: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="rounded-xl border border-amber-500/40 bg-amber-500/5 overflow-hidden"
    >
      <summary className="cursor-pointer select-none px-4 py-3 flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors">
        <AlertTriangle className="h-4 w-4" />
        AI 原始响应(JSON 解析失败)
        <span className="text-xs font-normal opacity-75">
          (展开查看,共 {raw.length} 字符)
        </span>
      </summary>
      <div className="border-t border-amber-500/30 bg-[var(--bg)]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
          <span className="text-xs text-[var(--ink-subtle)]">
            复制全部内容以便排查,或调整 prompt 后重试
          </span>
          <button
            onClick={handleCopy}
            className="text-xs px-2.5 py-1 rounded-md bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--ink)] transition-colors"
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre className="max-h-96 overflow-y-auto scrollbar-thin p-4 text-xs font-mono whitespace-pre-wrap break-all leading-relaxed text-[var(--ink-muted)]">
          {raw}
        </pre>
      </div>
    </details>
  );
}