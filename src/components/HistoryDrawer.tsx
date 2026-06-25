import { Drawer } from './ui/Drawer';
import { useAppStore } from '@/store/useAppStore';
import { Button } from './ui/Button';
import { relativeTime, formatDateTime } from '@/services/time';
import { Trash2, ExternalLink, History as HistoryIcon, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export function HistoryDrawer() {
  const open = useAppStore((s) => s.drawer.history);
  const setDrawer = useAppStore((s) => s.setDrawer);
  const history = useAppStore((s) => s.history);
  const loadFromHistory = useAppStore((s) => s.loadFromHistory);
  const removeFromHistory = useAppStore((s) => s.removeFromHistory);
  const clearAllHistory = useAppStore((s) => s.clearAllHistory);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        setDrawer('history', v);
        if (!v) setConfirmClear(false);
      }}
      title="对话记录"
      description={`共 ${history.length} 条 · 仅保存在本机`}
      side="left"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--ink-subtle)]">
            清除浏览器数据将一并清除记录
          </span>
          <Button
            variant={confirmClear ? 'danger' : 'ghost'}
            size="sm"
            onClick={() => {
              if (!confirmClear) {
                setConfirmClear(true);
                return;
              }
              clearAllHistory();
              setConfirmClear(false);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {confirmClear ? '再次点击确认' : '清空全部'}
          </Button>
        </div>
      }
    >
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="h-12 w-12 rounded-2xl bg-[var(--bg-soft)] flex items-center justify-center mb-3">
            <HistoryIcon className="h-5 w-5 text-[var(--ink-subtle)]" />
          </div>
          <p className="text-sm text-[var(--ink-muted)]">暂无历史记录</p>
          <p className="text-xs text-[var(--ink-subtle)] mt-1">
            完成的解读会自动保存到这里
          </p>
        </div>
      ) : (
        <ul className="space-y-2 -mx-1">
          {history.map((item) => (
            <li
              key={item.id}
              className="group rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/40 hover:bg-[var(--bg-soft)] transition-colors overflow-hidden"
            >
              <button
                onClick={() => {
                  loadFromHistory(item.id);
                  setDrawer('history', false);
                }}
                className="w-full text-left p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-[var(--ink)] line-clamp-2 flex-1 min-w-0">
                    {item.videoTitle || item.bvid}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--ink-subtle)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-all shrink-0"
                    aria-label="删除"
                    title="删除该条"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {item.focus && (
                  <p className="text-xs text-[var(--ink-muted)] line-clamp-2">
                    <span className="text-[var(--ink-subtle)]">关注点:</span> {item.focus}
                  </p>
                )}
                {item.chatMessages && item.chatMessages.length > 0 && (
                  <p className="text-[11px] text-brand-500 inline-flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {item.chatMessages.length} 条追问
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-[var(--ink-subtle)]">
                  <span title={formatDateTime(item.createdAt)}>{relativeTime(item.createdAt)}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 hover:text-brand-500"
                  >
                    B 站 <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}