/**
 * 把秒数格式化为 "HH:MM:SS" 或 "MM:SS"(不足一小时省略小时)。
 * 也支持 "MM:SS" 形式,根据需要传入 options.style。
 */
export function formatTime(sec: number, opts?: { alwaysHours?: boolean }): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = String(m).padStart(2, '0');
  const ssStr = String(ss).padStart(2, '0');
  if (h > 0 || opts?.alwaysHours) {
    return `${String(h).padStart(2, '0')}:${mm}:${ssStr}`;
  }
  return `${mm}:${ssStr}`;
}

/**
 * 把秒数格式化为可读的时长描述: "1小时23分45秒" / "23分45秒"。
 */
export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}小时${m}分${s}秒`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

/**
 * 把时间戳(毫秒)转为相对时间文本: "刚刚" / "N 分钟前" / "N 小时前" / "N 天前"。
 */
export function relativeTime(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 30) return '刚刚';
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  const date = new Date(ts);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 把时间戳格式化为完整日期时间字符串,用于历史记录展示。
 */
export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}