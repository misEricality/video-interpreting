import { useEffect, useState } from 'react';
import { Drawer } from './ui/Drawer';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { SecurityNotice } from './SecurityNotice';
import { useAppStore } from '@/store/useAppStore';
import { Eye, EyeOff, Trash2, ExternalLink, HelpCircle } from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import * as Tooltip from '@radix-ui/react-tooltip';

export function SettingsDrawer() {
  const open = useAppStore((s) => s.drawer.settings);
  const setDrawer = useAppStore((s) => s.setDrawer);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const clearAllData = useAppStore((s) => s.clearAllData);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [sessdataInput, setSessdataInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showSess, setShowSess] = useState(false);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [model, setModel] = useState(settings.model);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [useChunked, setUseChunked] = useState(settings.useChunked);
  const [rememberKey, setRememberKey] = useState(settings.rememberKey);
  const [rememberSessdata, setRememberSessdata] = useState(settings.rememberSessdata);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // 打开时初始化表单
  useEffect(() => {
    if (open) {
      setApiKeyInput(settings.apiKey);
      setSessdataInput(settings.sessdata);
      setBaseUrl(settings.baseUrl);
      setModel(settings.model);
      setTemperature(settings.temperature);
      setUseChunked(settings.useChunked);
      setRememberKey(settings.rememberKey);
      setRememberSessdata(settings.rememberSessdata);
      setShowKey(false);
      setShowSess(false);
      setConfirmClear(false);
    }
  }, [open, settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        apiKey: apiKeyInput,
        sessdata: sessdataInput,
        baseUrl: baseUrl.trim() || 'https://api.minimaxi.com/v1',
        model: model.trim() || 'MiniMax-M3',
        temperature,
        useChunked,
        rememberKey,
        rememberSessdata,
      });
      setDrawer('settings', false);
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    await clearAllData();
    setConfirmClear(false);
    setDrawer('settings', false);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => setDrawer('settings', v)}
      title="设置"
      description="配置 MiniMax API 与个性化选项"
      side="right"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className={confirmClear ? 'text-[var(--danger)]' : ''}
          >
            <Trash2 className="h-4 w-4" />
            {confirmClear ? '再次点击确认清空' : '清空所有数据'}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDrawer('settings', false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              保存
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <SecurityNotice />

        {/* API Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--ink)]">MiniMax API Key</label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="eyJhbGciOi..."
              autoComplete="off"
              spellCheck={false}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="hover:text-[var(--ink)]"
                  aria-label={showKey ? '隐藏' : '显示'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </div>
          <p className="text-xs text-[var(--ink-subtle)]">
            没有?前往{' '}
            <a
              href="https://api.minimaxi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline inline-flex items-center gap-0.5"
            >
              MiniMax 控制台
              <ExternalLink className="h-3 w-3" />
            </a>{' '}
            获取。
          </p>
        </div>

        {/* Endpoint & Model */}
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--ink)]">API Base URL</label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.minimaxi.com/v1"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--ink)]">模型</label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="MiniMax-M3"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--ink)] flex items-center justify-between">
              <span>Temperature</span>
              <span className="text-xs text-[var(--ink-subtle)] font-mono">{temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>
        </div>

        {/* B站 SESSDATA */}
        <div className="space-y-2 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium text-[var(--ink)]">B 站 SESSDATA</label>
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className="text-[var(--ink-subtle)] hover:text-[var(--ink)]"
                    aria-label="什么是 SESSDATA"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="z-50 max-w-xs rounded-lg bg-[var(--ink)] text-[var(--bg)] text-xs p-2.5 leading-relaxed shadow-soft-lg"
                    sideOffset={4}
                  >
                    B 站登录后的 Cookie 中的 <code className="bg-white/10 px-1 rounded">SESSDATA</code>{' '}
                    字段,用于访问登录或付费视频的字幕。仅在你需要时填写。
                    <Tooltip.Arrow className="fill-[var(--ink)]" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
          <Input
            type={showSess ? 'text' : 'password'}
            value={sessdataInput}
            onChange={(e) => setSessdataInput(e.target.value)}
            placeholder="(选填,仅在需要访问登录内容时填)"
            autoComplete="off"
            spellCheck={false}
            suffix={
              <button
                type="button"
                onClick={() => setShowSess((v) => !v)}
                className="hover:text-[var(--ink)]"
                aria-label={showSess ? '隐藏' : '显示'}
              >
                {showSess ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <details className="text-xs text-[var(--ink-subtle)]">
            <summary className="cursor-pointer hover:text-[var(--ink-muted)] select-none">
              如何获取 SESSDATA?
            </summary>
            <ol className="mt-2 space-y-1 pl-4 list-decimal leading-relaxed">
              <li>在浏览器登录 bilibili.com</li>
              <li>按 F12 打开 DevTools → Application 标签 → Cookies → bilibili.com</li>
              <li>找到 <code className="bg-[var(--bg-soft)] px-1 rounded">SESSDATA</code> 这一行,复制 Value</li>
              <li>粘贴到上方输入框(不要带引号)</li>
            </ol>
          </details>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2 border-t border-[var(--border)]">
          <SettingSwitch
            label="启用分块 Map-Reduce"
            description="长视频(>8 分钟)自动分片后再合并,避免超出 token 上限"
            checked={useChunked}
            onChange={setUseChunked}
          />
          <SettingSwitch
            label="记住 API Key"
            description="加密保存在本机浏览器,下次自动填充"
            checked={rememberKey}
            onChange={setRememberKey}
          />
          <SettingSwitch
            label="记住 SESSDATA"
            description="加密保存在本机浏览器,下次自动填充"
            checked={rememberSessdata}
            onChange={setRememberSessdata}
          />
        </div>
      </div>
    </Drawer>
  );
}

function SettingSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--ink)]">{label}</div>
        <div className="text-xs text-[var(--ink-subtle)] mt-0.5">{description}</div>
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full bg-[var(--border-strong)] data-[state=checked]:bg-brand-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[22px]" />
      </Switch.Root>
    </div>
  );
}