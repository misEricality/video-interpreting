import { useState } from 'react';
import type { ChatMessage } from '@/types';
import { Copy, Check, RotateCcw, AlertCircle, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import clsx from 'clsx';

interface Props {
  message: ChatMessage;
  /** 是否是最后一条消息(用于显示重新生成按钮) */
  isLast: boolean;
  /** 是否是最后一条 assistant 消息(用于显示重新生成按钮) */
  isLastAssistant: boolean;
  /** 重新生成回调(仅 assistant 消息使用) */
  onRegenerate?: () => void;
  /** 重新生成时是否正在流式 */
  regenerating?: boolean;
}

export function ChatMessageItem({
  message,
  isLast,
  isLastAssistant,
  onRegenerate,
  regenerating,
}: Props) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isStreaming = message.status === 'streaming';

  return (
    <div
      className={clsx(
        'flex gap-2.5',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* AI 头像 */}
      {!isUser && (
        <div className="shrink-0 h-7 w-7 rounded-lg bg-brand-500/10 flex items-center justify-center mt-0.5">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" />
        </div>
      )}

      <div
        className={clsx(
          'min-w-0 max-w-[85%] sm:max-w-[75%] flex flex-col gap-1',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* 气泡 / 内容 */}
        <div
          className={clsx(
            'rounded-2xl px-3.5 py-2.5 text-sm break-words',
            isUser
              ? 'bg-brand-500 text-white rounded-tr-sm'
              : isError
                ? 'bg-[var(--danger-soft)] border border-[var(--danger)]/40 text-[var(--ink)] rounded-tl-sm'
                : 'bg-[var(--bg-soft)] text-[var(--ink)] rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
              {message.regenerated && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-white/70 align-middle">
                  <RotateCcw className="h-2.5 w-2.5" />
                  重新生成
                </span>
              )}
            </p>
          ) : isStreaming && !message.content ? (
            <TypingDots />
          ) : (
            <div className="prose-app text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {message.content || '...'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {isError && message.error && (
          <div className="flex items-center gap-1.5 px-1 text-xs text-[var(--danger)]">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{message.error}</span>
          </div>
        )}

        {/* 工具栏(仅 assistant 消息) */}
        {!isUser && !isError && (message.content || isStreaming) && (
          <MessageActions
            content={message.content}
            showRegenerate={isLastAssistant && isLast && !isStreaming}
            onRegenerate={onRegenerate}
            regenerating={regenerating}
          />
        )}
      </div>

      {/* 用户头像 */}
      {isUser && (
        <div className="shrink-0 h-7 w-7 rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] flex items-center justify-center mt-0.5">
          <User className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
        </div>
      )}
    </div>
  );
}

function MessageActions({
  content,
  showRegenerate,
  onRegenerate,
  regenerating,
}: {
  content: string;
  showRegenerate: boolean;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center gap-1 px-1 text-[var(--ink-subtle)]">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:bg-[var(--bg-soft)] hover:text-[var(--ink)] transition-colors"
        title="复制"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-emerald-500" />
            <span>已复制</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            <span>复制</span>
          </>
        )}
      </button>
      {showRegenerate && onRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:bg-[var(--bg-soft)] hover:text-[var(--ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="重新生成"
        >
          <RotateCcw className={clsx('h-3 w-3', regenerating && 'animate-spin')} />
          <span>重新生成</span>
        </button>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-subtle)] animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-subtle)] animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-subtle)] animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
