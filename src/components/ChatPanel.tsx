import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ChatMessageItem } from './ChatMessageItem';
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Send,
  Square,
  Trash2,
  Info,
} from 'lucide-react';
import clsx from 'clsx';

const COLLAPSE_KEY = 'vi.chat.collapsed.v1';

export function ChatPanel() {
  const current = useAppStore((s) => s.current);
  const streamStatus = useAppStore((s) => s.chatStreamStatus);
  const sendChatMessage = useAppStore((s) => s.sendChatMessage);
  const stopChatMessage = useAppStore((s) => s.stopChatMessage);
  const clearChat = useAppStore((s) => s.clearChat);
  const regenerateLastAnswer = useAppStore((s) => s.regenerateLastAnswer);

  // 折叠状态(持久化)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);

  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  if (!current) return null;

  const messages = current.chatMessages ?? [];
  const isStreaming = streamStatus === 'streaming';
  const noSubtitle = !current.subtitles || current.subtitles.length === 0;
  const lastIdx = messages.length - 1;
  const lastIsAssistant = lastIdx >= 0 && messages[lastIdx].role === 'assistant';
  const lastAssistantContent = lastIsAssistant ? messages[lastIdx].content : '';

  // 自动滚动到底部
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // 使用 rAF 等待 DOM 更新
    const id = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length, lastAssistantContent]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendChatMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 自动撑高 textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  if (collapsed) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
        <button
          onClick={() => setCollapsed(false)}
          className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-[var(--bg-soft)] transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-3.5 w-3.5 text-brand-500" />
            </div>
            <span className="text-sm font-semibold text-[var(--ink)]">继续提问</span>
            {messages.length > 0 && (
              <span className="text-xs text-[var(--ink-subtle)]">
                ({messages.filter((m) => m.role === 'user').length} 轮)
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--ink-muted)] shrink-0" />
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      {/* 顶栏 */}
      <header className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
            <MessageCircle className="h-3.5 w-3.5 text-brand-500" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--ink)]">继续提问</h3>
          {messages.length > 0 && (
            <span className="text-xs text-[var(--ink-subtle)]">
              ({messages.filter((m) => m.role === 'user').length} 轮)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && !isStreaming && (
            <button
              onClick={() => {
                if (window.confirm('确认清空当前对话的追问历史?')) {
                  clearChat();
                }
              }}
              className="p-1.5 rounded-lg text-[var(--ink-subtle)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
              title="清空"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--bg-soft)] transition-colors"
            title="收起"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 字幕缺失提示 */}
      {noSubtitle && (
        <div className="mx-4 sm:mx-5 mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>无原始字幕上下文,AI 将仅基于已生成的总结回答。</span>
        </div>
      )}

      {/* 消息列表 */}
      <div
        ref={listRef}
        className="px-4 sm:px-5 py-4 max-h-[60vh] overflow-y-auto scrollbar-thin space-y-4"
      >
        {messages.length === 0 ? (
          <EmptyChat />
        ) : (
          messages.map((m, i) => (
            <ChatMessageItem
              key={m.id}
              message={m}
              isLast={i === lastIdx}
              isLastAssistant={i === lastIdx && m.role === 'assistant'}
              onRegenerate={regenerateLastAnswer}
              regenerating={isStreaming}
            />
          ))
        )}
      </div>

      {/* 输入区 */}
      <div className="px-4 sm:px-5 py-3 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="向 AI 追问,例如:这个视频讲了什么语法点?举几个例子..."
            disabled={isStreaming}
            rows={1}
            className={clsx(
              'flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]',
              'px-3 py-2 text-sm leading-relaxed',
              'placeholder:text-[var(--ink-subtle)] text-[var(--ink)]',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'scrollbar-thin'
            )}
          />
          {isStreaming ? (
            <button
              onClick={stopChatMessage}
              className="shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-xl bg-[var(--danger)] text-white hover:opacity-90 transition-colors"
              title="停止"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={clsx(
                'shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-xl',
                'bg-brand-500 text-white hover:bg-brand-600 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="发送"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--ink-subtle)]">
          Enter 发送 · Shift+Enter 换行 · AI 可能产生错误,关键信息请核对视频原内容
        </p>
      </div>
    </section>
  );
}

function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8">
      <div className="h-10 w-10 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-2.5">
        <MessageCircle className="h-5 w-5 text-brand-500" />
      </div>
      <p className="text-sm text-[var(--ink-muted)]">还没有追问记录</p>
      <p className="text-xs text-[var(--ink-subtle)] mt-1">
        基于视频字幕 + 关注点 + 已生成的总结来回答
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
        {['这段视频的核心观点是什么?', '讲解了哪些语法点?', '适合什么水平的学习者?'].map((q) => (
          <SuggestionChip key={q} text={q} />
        ))}
      </div>
    </div>
  );
}

function SuggestionChip({ text }: { text: string }) {
  const sendChatMessage = useAppStore((s) => s.sendChatMessage);
  const streamStatus = useAppStore((s) => s.chatStreamStatus);
  const disabled = streamStatus === 'streaming';
  return (
    <button
      disabled={disabled}
      onClick={() => !disabled && sendChatMessage(text)}
      className={clsx(
        'px-2.5 py-1 rounded-full text-xs border border-[var(--border)] bg-[var(--bg-elevated)]',
        'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-brand-500/40 hover:bg-brand-500/5',
        'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {text}
    </button>
  );
}
