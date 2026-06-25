import { Sparkles } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)]/40">
      <div className="h-14 w-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
        <Sparkles className="h-7 w-7 text-brand-500" />
      </div>
      <h3 className="text-base font-semibold text-[var(--ink)] mb-1.5">还没有解读结果</h3>
      <p className="text-sm text-[var(--ink-muted)] max-w-md leading-relaxed">
        在上方粘贴一个 Bilibili 视频链接,写下你想了解的关注点,
        <br className="hidden sm:block" />
        AI 将为你总结视频内容,并定位与关注点相关的具体时间段。
      </p>
    </div>
  );
}