import { useState, useEffect, useMemo } from 'react';
import { Drawer } from './ui/Drawer';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { findVendorByModel, VENDORS } from '@/config/vendors';
import {
  KeyRound,
  Cookie,
  Cpu,
  Thermometer,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export function SettingsDrawer() {
  const open = useAppStore((s) => s.drawer.settings);
  const setDrawer = useAppStore((s) => s.setDrawer);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const clearAllData = useAppStore((s) => s.clearAllData);

  // 本地表单 state(允许"取消不保存")
  const [draft, setDraft] = useState(settings);

  // 抽屉打开时,每次重置 draft 为最新 settings
  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  // 根据当前模型自动识别厂商,用于"申请 Key"链接
  const vendor = useMemo(() => findVendorByModel(draft.model), [draft.model]);
  // 收集所有已知模型,用作 datalist(跨厂商聚合)
  const allModels = useMemo(
    () => VENDORS.flatMap((v) => v.models.map((m) => ({ ...m, vendorName: v.name }))),
    []
  );

  const handleSave = async () => {
    if (!draft.apiKey.trim()) {
      alert('请填写 API Key');
      return;
    }
    if (!draft.model.trim()) {
      alert('请填写模型名');
      return;
    }
    await updateSettings(draft);
    setDrawer('settings', false);
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        '确定要清空所有数据吗?(API Key、对话历史、SESSDATA)\n此操作不可恢复!'
      )
    )
      return;
    await clearAllData();
    setDrawer('settings', false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => setDrawer('settings', v)}
      title="设置"
      description="模型、Key、视频解读行为"
      side="right"
      width="w-full sm:max-w-lg"
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setDrawer('settings', false)}>
            取消
          </Button>
          <Button onClick={handleSave} className="flex-1">
            保存
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-sm">
        {/* ============ 模型 ============ */}
        <Section icon={<Cpu className="h-4 w-4 text-brand-500" />} title="模型">
          <Input
            value={draft.model}
            onChange={(e) => setDraft({ ...draft, model: e.target.value })}
            placeholder="例如 MiniMax-M3 / deepseek-chat / gpt-4o"
            spellCheck={false}
            list="known-models"
          />
          <datalist id="known-models">
            {allModels.map((m) => (
              <option key={`${m.vendorName}-${m.id}`} value={m.id}>
                {m.label} · {m.vendorName}
              </option>
            ))}
          </datalist>
        </Section>

        {/* ============ API Key ============ */}
        <Section icon={<KeyRound className="h-4 w-4 text-brand-500" />} title="API Key">
          <div className="space-y-2">
            <Input
              type="password"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
              placeholder="填入 Key"
              autoComplete="off"
              spellCheck={false}
            />
            {vendor && (
              <a
                href={vendor.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline"
              >
                去 {vendor.name} 控制台申请 Key
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <label className="flex items-center gap-2 text-xs text-[var(--ink-muted)] cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={draft.rememberKey}
                onChange={(e) =>
                  setDraft({ ...draft, rememberKey: e.target.checked })
                }
                className="rounded"
              />
              记住 API Key(本机加密存储)
            </label>
          </div>
        </Section>

        {/* ============ 高级:只剩 Temperature + Chunked ============ */}
        <Section icon={<Thermometer className="h-4 w-4 text-brand-500" />} title="高级">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--ink-muted)] mb-1 flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  Temperature
                </span>
                <span className="text-[var(--ink)] font-mono">
                  {draft.temperature.toFixed(1)}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={draft.temperature}
                onChange={(e) =>
                  setDraft({ ...draft, temperature: parseFloat(e.target.value) })
                }
                className="w-full accent-brand-500"
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-[var(--ink-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={draft.useChunked}
                onChange={(e) =>
                  setDraft({ ...draft, useChunked: e.target.checked })
                }
                className="mt-0.5 rounded"
              />
              <span>
                <strong className="text-[var(--ink)]">启用分块 Map-Reduce</strong>
                <br />
                <span className="text-[var(--ink-subtle)]">
                  长视频(&gt; 8 分钟)切片分别解读再合并,更稳但更慢。
                </span>
              </span>
            </label>
          </div>
        </Section>

        {/* ============ SESSDATA ============ */}
        <Section icon={<Cookie className="h-4 w-4 text-brand-500" />} title="B 站 SESSDATA">
          <SessdataControl
            value={draft.sessdata}
            remember={draft.rememberSessdata}
            onChange={(v, r) => setDraft({ ...draft, sessdata: v, rememberSessdata: r })}
          />
        </Section>

        {/* ============ 危险区 ============ */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            危险操作
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearAll}
            icon={<Trash2 className="h-3.5 w-3.5" />}
            className="text-rose-600 hover:bg-rose-500/10"
          >
            清空所有数据
          </Button>
          <p className="text-[10px] text-[var(--ink-subtle)] leading-relaxed">
            删除本地保存的所有 API Key、SESSDATA、对话历史。
            <br />
            不会影响你在各 AI 厂商那边的 Key。
          </p>
        </div>

        {/* 重置按钮 */}
        <div className="pt-2 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() => {
              if (
                confirm(
                  '恢复默认设置?当前 Key/历史不会被删除,只重置模型、Base URL 为初始配置。'
                )
              ) {
                setDraft({ ...settings, model: 'MiniMax-M3', baseUrl: 'https://api.minimaxi.com/v1' });
              }
            }}
          >
            恢复默认
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

/* ============== 子组件 ============== */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)] mb-2">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function SessdataControl({
  value,
  remember,
  onChange,
}: {
  value: string;
  remember: boolean;
  onChange: (v: string, r: boolean) => void;
}) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className="space-y-2">
      <Input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value, remember)}
        placeholder="可选。填了能拿登录/付费视频的字幕"
        autoComplete="off"
        spellCheck={false}
      />
      <div className="flex items-center gap-3 text-xs">
        <label className="flex items-center gap-1.5 text-[var(--ink-muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => onChange(value, e.target.checked)}
            className="rounded"
          />
          记住
        </label>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-brand-500 hover:underline"
        >
          {showHelp ? '收起' : '怎么获取?'}
        </button>
      </div>
      {showHelp && (
        <ol className="text-xs text-[var(--ink-muted)] space-y-1 pl-4 list-decimal leading-relaxed">
          <li>浏览器登录 bilibili.com</li>
          <li>F12 → Application → Cookies → https://www.bilibili.com</li>
          <li>找 SESSDATA,双击 Value 列复制</li>
          <li>
            或 Console 跑{' '}
            <code className="bg-[var(--bg-soft)] px-1 rounded text-[10px]">
              document.cookie.match(/SESSDATA=([^;]+)/)?.[1]
            </code>
          </li>
        </ol>
      )}
    </div>
  );
}
