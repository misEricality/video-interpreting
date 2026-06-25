import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { loadTheme, saveTheme, type ThemeMode } from '@/services/storage';

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('system');

  useEffect(() => {
    setTheme(loadTheme());
  }, []);

  useEffect(() => {
    const apply = (t: ThemeMode) => {
      const isDark =
        t === 'dark' ||
        (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    apply(theme);
    saveTheme(theme);
  }, [theme]);

  // 监听系统主题变化(当 mode = system 时)
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      document.documentElement.classList.toggle('dark', mq.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const toggle = () => {
    setTheme((cur) => {
      const isDark = document.documentElement.classList.contains('dark');
      return isDark ? 'light' : 'dark';
    });
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--ink)] transition-colors"
      aria-label="切换主题"
      title={isDark ? '切换到浅色' : '切换到深色'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}