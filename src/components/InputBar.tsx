import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Input, Textarea } from './ui/Input';
import { Button } from './ui/Button';
import { cleanBiliUrl, parseBvid } from '@/utils/url';
import { Loader2, Sparkles, Link2, MessageSquareText, Wand2 } from 'lucide-react';

export function InputBar() {
  const [url, setUrl] = useState('');
  const [focus, setFocus] = useState('');
  const [urlError, setUrlError] = useState('');
  const [urlCleaned, setUrlCleaned] = useState(false);
  const runInterpretation = useAppStore((s) => s.runInterpretation);
  const loading = useAppStore((s) => s.loading);
  const isLoading = loading.stage !== 'idle' && loading.stage !== 'done';

  /**
   * 输入框失焦时,若用户输入的链接包含额外的 query params
   * (常见的如 ?spm_id_from=...&vd_source=...&p=5),
   * 自动清洗成 https://www.bilibili.com/video/{bvid} 形式。
   * 单纯展示一个绿色提示,告诉用户 URL 已被简化,提升可读性。
   */
  const handleUrlBlur = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const cleaned = cleanBiliUrl(trimmed);
    if (cleaned && cleaned !== trimmed) {
      setUrl(cleaned);
      setUrlCleaned(true);
      // 3 秒后清除提示(下次重新聚焦/失焦再触发)
      setTimeout(() => setUrlCleaned(false), 3000);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const bvid = parseBvid(url);
    if (!bvid) {
      setUrlError('请输入有效的 Bilibili 视频链接(需包含 BV 号)');
      return;
    }
    setUrlError('');
    runInterpretation({ url, focus: focus.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--ink-muted)] flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          Bilibili 视频链接
        </label>
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (urlError) setUrlError('');
            if (urlCleaned) setUrlCleaned(false);
          }}
          onBlur={handleUrlBlur}
          placeholder="https://www.bilibili.com/video/BVxxxxxxxxxx"
          disabled={isLoading}
          autoComplete="off"
          spellCheck={false}
        />
        {urlCleaned && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 px-1 flex items-center gap-1">
            <Wand2 className="h-3 w-3" />
            已自动简化链接(去掉了分享时附加的追踪参数)
          </p>
        )}
        {urlError && (
          <p className="text-xs text-[var(--danger)] px-1">{urlError}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--ink-muted)] flex items-center gap-1.5">
          <MessageSquareText className="h-3.5 w-3.5" />
          关注点 <span className="text-[var(--ink-subtle)] font-normal">(选填,留空则总结主要内容)</span>
        </label>
        <Textarea
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="例如:讲解了哪些英语学习方法?有没有提到背单词的技巧?"
          rows={3}
          disabled={isLoading}
          maxLength={500}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        block
        loading={isLoading}
        icon={!isLoading ? <Sparkles className="h-4 w-4" /> : undefined}
      >
        {isLoading ? 'AI 解读中...' : '开始解读'}
      </Button>

      {isLoading && loading.message && (
        <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)] px-1">
          <Loader2 className="h-3 w-3 animate-spin text-brand-500" />
          {loading.message}
        </div>
      )}
    </form>
  );
}