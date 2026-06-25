import type { Conversation, Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

const KEY_HISTORY = 'vi.history.v1';
const KEY_SETTINGS = 'vi.settings.v1';
const KEY_THEME = 'vi.theme.v1';

const HISTORY_LIMIT = 50;

// ===== History =====

export function loadHistory(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidConversation);
  } catch (e) {
    console.warn('[storage] loadHistory failed:', e);
    return [];
  }
}

export function saveConversation(c: Conversation): Conversation[] {
  const list = loadHistory();
  // 去重:同一 bvid + focus 视为同一对话,移除旧的
  const filtered = list.filter(
    (item) => !(item.bvid === c.bvid && item.focus.trim() === c.focus.trim())
  );
  filtered.unshift(c);
  const trimmed = filtered.slice(0, HISTORY_LIMIT);
  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[storage] saveConversation failed (quota?):', e);
  }
  return trimmed;
}

export function deleteConversation(id: string): Conversation[] {
  const list = loadHistory().filter((c) => c.id !== id);
  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(list));
  } catch {}
  return list;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY_HISTORY);
  } catch {}
}

// ===== Settings =====

/**
 * 注意:存储的 Settings.apiKey 始终是「加密密文」(若 rememberKey=true)。
 * 解密发生在 useAppStore 启动时(loadSettings)。
 */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
  } catch (e) {
    console.warn('[storage] saveSettings failed:', e);
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(KEY_SETTINGS);
  } catch {}
}

// ===== Theme =====

export type ThemeMode = 'light' | 'dark' | 'system';

export function loadTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(KEY_THEME);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {}
  return 'system';
}

export function saveTheme(t: ThemeMode): void {
  try {
    localStorage.setItem(KEY_THEME, t);
  } catch {}
}

// ===== Clear All =====

export function clearAll(): void {
  clearHistory();
  clearSettings();
}

// ===== Validators =====

function isValidConversation(x: any): x is Conversation {
  return (
    x &&
    typeof x.id === 'string' &&
    typeof x.bvid === 'string' &&
    typeof x.focus === 'string' &&
    typeof x.summary === 'string' &&
    Array.isArray(x.cues) &&
    typeof x.createdAt === 'number'
    // chatMessages 字段为可选,旧数据可缺失
  );
}