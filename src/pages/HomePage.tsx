import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { InputBar } from '@/components/InputBar';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { ResultView } from '@/components/ResultView';
import { ErrorBanner } from '@/components/ErrorBanner';
import { SecurityModal } from '@/components/SecurityNotice';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Settings, History as HistoryIcon, Sparkles } from 'lucide-react';

const KEY_SECURITY_ACK = 'vi.security.ack.v1';

export function HomePage() {
  const setDrawer = useAppStore((s) => s.setDrawer);
  const loading = useAppStore((s) => s.loading);
  const error = loading.error;
  const [showSecurity, setShowSecurity] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY_SECURITY_ACK)) {
        setShowSecurity(true);
      }
    } catch {}
  }, []);

  const handleAck = () => {
    try {
      localStorage.setItem(KEY_SECURITY_ACK, '1');
    } catch {}
    setShowSecurity(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-soft">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[var(--ink)] leading-tight">视频解读</h1>
              <p className="text-[10px] text-[var(--ink-subtle)] leading-tight hidden sm:block">
                Bilibili · AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDrawer('history', true)}
              className="p-2 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--ink)] transition-colors"
              aria-label="历史记录"
              title="历史记录"
            >
              <HistoryIcon className="h-4 w-4" />
            </button>
            <ThemeToggle />
            <button
              onClick={() => setDrawer('settings', true)}
              className="p-2 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--ink)] transition-colors"
              aria-label="设置"
              title="设置"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero + Input */}
        <section className="space-y-4">
          <div className="text-center sm:text-left space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)]">
              让 AI 帮你解读视频
            </h2>
            <p className="text-sm text-[var(--ink-muted)]">
              粘贴 Bilibili 视频链接,写下你的关注点,AI 将总结内容并定位相关时间片段。
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5 shadow-soft">
            <InputBar />
            {error && (
              <div className="mt-3">
                <ErrorBanner message={error} />
              </div>
            )}
          </div>
        </section>

        {/* Result */}
        <section>
          <ResultView />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-[var(--ink-subtle)]">
          <span>视频解读 · 仅前端 · 数据保存在本机浏览器</span>
          <span className="hidden sm:inline">Powered by MiniMax M3</span>
        </div>
      </footer>

      {/* Drawers & Modals */}
      <SettingsDrawer />
      <HistoryDrawer />
      <SecurityModal open={showSecurity} onAcknowledge={handleAck} />
    </div>
  );
}