import type { SubtitleCue, VideoMeta } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

interface RawAidResponse {
  aid?: number;
  cid?: number;
  title?: string;
  duration?: number;
  pages?: number;
  error?: string;
  code?: number;
  detail?: string;
}

interface RawSubtitleResponse {
  cues?: SubtitleCue[];
  aiType?: number;
  error?: string;
  code?: number;
  detail?: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      // 强制转字符串,避免 { error: { ... } } 这种对象类型被拼成 [object Object]
      const rawErr = typeof j?.error === 'string' ? j.error : '';
      const rawDetail = typeof j?.detail === 'string' ? j.detail : '';
      detail = rawErr || rawDetail;
      if (!detail && j && typeof j === 'object') {
        detail = JSON.stringify(j).slice(0, 300);
      }
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`接口 ${res.status}: ${detail || res.statusText}`);
  }
  return res.json();
}

/**
 * 构造 URL,把可选的 sessdata 加为查询参数。
 */
function buildUrl(path: string, params: Record<string, string | number>, sessdata?: string): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    search.set(k, String(v));
  }
  if (sessdata) search.set('sessdata', sessdata);
  return `${API_BASE}${path}?${search.toString()}`;
}

export async function fetchVideoMeta(bvid: string, sessdata?: string): Promise<VideoMeta> {
  const data = await getJson<RawAidResponse>(buildUrl('/api/bili/aid', { bvid }, sessdata));
  if (!data.aid || !data.cid) {
    throw new Error(data.detail || data.error || '获取视频信息失败');
  }
  return {
    aid: data.aid,
    cid: data.cid,
    title: data.title ?? '',
    duration: data.duration ?? 0,
    pages: data.pages ?? 1,
  };
}

export async function fetchSubtitles(
  bvid: string,
  cid: number,
  sessdata?: string
): Promise<{ cues: SubtitleCue[]; aiSubtitle: boolean }> {
  const data = await getJson<RawSubtitleResponse>(
    buildUrl('/api/bili/subtitle', { bvid, cid }, sessdata)
  );
  if (data.error === 'no_subtitle') {
    return { cues: [], aiSubtitle: false };
  }
  if (!data.cues) {
    throw new Error(data.detail || data.error || '拉取字幕失败');
  }
  return { cues: data.cues, aiSubtitle: data.aiType === 1 };
}