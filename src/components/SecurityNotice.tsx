import { ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './ui/Button';

interface Props {
  /** 受控显示,默认 true(常驻显示) */
  alwaysShow?: boolean;
}

export function SecurityNotice({ alwaysShow = true }: Props) {
  const [open, setOpen] = useState(alwaysShow);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-brand-500 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[var(--ink)]">API Key 安全说明</h4>
          <ul className="mt-2 space-y-1.5 text-xs text-[var(--ink-muted)] leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="text-brand-500 shrink-0 leading-relaxed">·</span>
              <span className="min-w-0 flex-1">
                你的 API Key <strong>仅保存在本机浏览器</strong>的 localStorage 中(经 AES-256-GCM 加密),本站与部署服务器均无法获取。
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-brand-500 shrink-0 leading-relaxed">·</span>
              <span className="min-w-0 flex-1">
                部署的 Edge Functions <strong>只代理 B 站字幕请求</strong>,不会触及你的 Key(所有 AI 调用均由浏览器直接发往模型服务)。
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-brand-500 shrink-0 leading-relaxed">·</span>
              <span className="min-w-0 flex-1">
                请勿在公共/共享电脑使用,离开前请「清空所有数据」。
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-brand-500 shrink-0 leading-relaxed">·</span>
              <span className="min-w-0 flex-1">
                若怀疑泄露,请前往{' '}
                <a
                  href="https://api.minimaxi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 hover:underline inline-flex items-center gap-0.5"
                >
                  MiniMax 控制台
                  <ExternalLink className="h-3 w-3" />
                </a>{' '}
                立即撤销并重新生成。
              </span>
            </li>
          </ul>
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--ink-subtle)]">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>浏览器「自动填充 / 同步」可能在云端保存 Key,建议关闭相应同步设置。</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 首次进入时的安全声明 Modal(只显示一次,除非用户重置数据)。
 */
export function SecurityModal({
  open,
  onAcknowledge,
}: {
  open: boolean;
  onAcknowledge: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg p-6 rounded-2xl bg-[var(--bg-elevated)] shadow-soft-lg"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-semibold text-[var(--ink)]">
                开始使用前请了解
              </Dialog.Title>
              <Dialog.Description className="text-sm text-[var(--ink-muted)] mt-1">
                本应用不会保存你的数据到任何服务器。
              </Dialog.Description>
            </div>
          </div>
          <SecurityNotice />
          <div className="mt-5 flex justify-end">
            <Button onClick={onAcknowledge}>我已知晓,继续</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}