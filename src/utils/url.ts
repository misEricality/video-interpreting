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
 * 把用户输入的 B 站链接清洗成「开头的纯 URL」,即:
 *   - 保留到 BV 号结束为止
 *   - 去掉所有 query params(包括 ?p=N、spm_id_from、vd_source 等)
 *
 * 用途:用户经常复制带一大堆追踪参数的完整分享链接,
 * 真正用到的只有 https://www.bilibili.com/video/{bvid}。
 * 在「点击解读」前清洗一次即可,不要修改用户输入框里正在打字的原文。
 *
 * 例:
 *   in : https://www.bilibili.com/video/BV1mvfKYJEqf?spm_id_from=333.788&p=5
 *   out: https://www.bilibili.com/video/BV1mvfKYJEqf
 */
export function cleanBiliUrl(input: string): string | null {
  const bvid = parseBvid(input);
  if (!bvid) return null;
  return `https://www.bilibili.com/video/${bvid}`;
}

/**
 * 规范化 B 站视频链接(尽可能还原成完整 https URL)。
 * 若输入是 BV 号,补成 https://www.bilibili.com/video/{bvid}
 *
 * @deprecated 自 0.x 起改为 cleanBiliUrl(语义更明确:不会保留 ?p=N)。
 *             保留仅为兼容旧调用方,新代码请用 cleanBiliUrl。
 */
export function normalizeBiliUrl(input: string): string | null {
  return cleanBiliUrl(input);
}

/**
 * 构造跳转到指定时间点的 B 站链接。
 */
export function buildBiliTimestampUrl(bvid: string, seconds: number): string {
  return `https://www.bilibili.com/video/${bvid}?t=${Math.max(0, Math.floor(seconds))}`;
}