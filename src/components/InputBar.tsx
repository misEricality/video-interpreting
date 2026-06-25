import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Input, Textarea } from './ui/Input';
import { Button } from './ui/Button';
import { parseBvid } from '@/utils/url';
import { Loader2, Sparkles, Link2, MessageSquareText } from 'lucide-react';

export function InputBar() {
  const [url, setUrl] = useState('');
  const [focus, setFocus] = useState('');
  const [urlError, setUrlError] = useState('');
  const runInterpretation = useAppStore((s) => s.runInterpretation);
  const loading = useAppStore((s) => s.loading);
  const isLoading = loading.stage !== 'idle' && loading.stage !== 'done';

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
          }}
          placeholder="https://www.bilibili.com/video/BVxxxxxxxxxx"
          disabled={isLoading}
          autoComplete="off"
          spellCheck={false}
        />
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