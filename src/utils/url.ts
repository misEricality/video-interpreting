/**
 * 从 Bilibili URL 中提取 BV 号。
 * 支持的格式:
 *  - https://www.bilibili.com/video/BVxxxxxxxxxx
 *  - https://www.bilibili.com/video/BVxxxxxxxxxx?p=1
 *  - https://www.bilibili.com/video/BVxxxxxxxxxx/?spm=...
 *  - BVxxxxxxxxxx(裸号)
 *  - https://b23.tv/xxxxxxxx(B 站短链,无法在不 fetch 的情况下解析,故只做宽松匹配)
 */
const BV_RE = /(BV[1-9A-HJ-NP-Za-km-z]{10})/;

export function parseBvid(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const m = trimmed.match(BV_RE);
  return m ? m[1] : null;
}

/**
 * 规范化 B 站视频链接(尽可能还原成完整 https URL)。
 * 若输入是 BV 号,补成 https://www.bilibili.com/video/{bvid}
 */
export function normalizeBiliUrl(input: string): string | null {
  const bvid = parseBvid(input);
  if (!bvid) return null;
  return `https://www.bilibili.com/video/${bvid}`;
}

/**
 * 构造跳转到指定时间点的 B 站链接。
 */
export function buildBiliTimestampUrl(bvid: string, seconds: number): string {
  return `https://www.bilibili.com/video/${bvid}?t=${Math.max(0, Math.floor(seconds))}`;
}