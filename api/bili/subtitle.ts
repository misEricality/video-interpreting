// GET /api/bili/subtitle?bvid=xxx&cid=xxx[&sessdata=xxx]
// 返回 { cues: SubtitleCue[], aiType: 0|1 }
//
// Vercel Edge runtime:Web API 风格(Request/Response/fetch)

import {
  BILI_HEADERS,
  corsWrap,
  errorResponse,
  handleOptions,
  jsonResponse,
} from '../_utils/cors';
// 保留:WBI 重试兜底(暂未启用,见下方注释)
import { signWbi } from '../_utils/wbi';

interface SubtitleCue {
  from: number;
  to: number;
  content: string;
  sid: number;
  lang: string;
}

// 关键:声明 Edge runtime
export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return handleOptions();

  const url = new URL(request.url);
  const bvid = url.searchParams.get('bvid');
  const cidStr = url.searchParams.get('cid');
  const sessdata = url.searchParams.get('sessdata')?.trim() || '';

  if (!bvid || !cidStr) {
    return corsWrap(errorResponse('missing_params', undefined, 400, '需要 bvid 和 cid'));
  }
  const cid = Number(cidStr);
  if (!Number.isFinite(cid)) {
    return corsWrap(errorResponse('invalid_cid', undefined, 400, 'cid 格式不正确'));
  }

  const headers: Record<string, string> = sessdata
    ? { ...BILI_HEADERS, Cookie: `SESSDATA=${sessdata}` }
    : { ...BILI_HEADERS };

  // 我们需要 aid 来签 wbi(若未签能直接拿到字幕,就不签)
  // 第一次尝试:不带签名
  let playerUrl = `https://api.bilibili.com/x/player/wbi/v2?bvid=${bvid}&cid=${cid}`;
  let playerRes = await fetch(playerUrl, { headers });
  let playerJson: any = await playerRes.json().catch(() => null);

  // 如果失败,尝试加签名重试
  if (!playerJson || playerJson.code !== 0) {
    try {
      // 暂时无 aid,先用 cid 跑签名(其实 wbi 接口也需要 aid),跳过重试
      // 实测多数场景不带签名能成功,这里不再重试以减少复杂度。
      // signWbi 的导入仅为占位 - 证明 Edge runtime 下也能编译,后续启用重试时直接调用。
      void signWbi;
    } catch {}
  }

  if (!playerJson || playerJson.code !== 0) {
    return corsWrap(
      errorResponse(
        'player_failed',
        playerJson?.code,
        502,
        playerJson?.message || `B 站字幕接口返回错误(code=${playerJson?.code})`
      )
    );
  }

  const subs: any[] = playerJson.data?.subtitle?.subtitles ?? [];
  if (!subs.length) {
    const detail = playerJson.data?.need_login_subtitle
      ? '字幕需要登录 B 站账号。请在「设置」填入 SESSDATA(你自己的 B 站 Cookie)。'
      : '该视频暂无可用字幕(可能为充电/付费视频,或 UP 主未上传字幕)';
    return corsWrap(errorResponse('no_subtitle', undefined, 404, detail));
  }

  // 优先选择人工字幕(type=0 / ai_type=0 / ai_subtitle 不存在),其次选第一个
  const human = subs.find((s) => (s.ai_type === 0 || s.type === 0) && !s.ai_subtitle);
  const chosen = human ?? subs[0];

  let subUrl: string = chosen.subtitle_url ?? '';
  if (subUrl.startsWith('//')) subUrl = 'https:' + subUrl;
  if (!subUrl.startsWith('http')) {
    return corsWrap(errorResponse('bad_subtitle_url', undefined, 502, '字幕 URL 无法解析'));
  }

  try {
    const subRes = await fetch(subUrl, { headers });
    const subJson: any = await subRes.json();
    const body: any[] = Array.isArray(subJson?.body) ? subJson.body : [];

    const cues: SubtitleCue[] = body.map((b: any) => ({
      from: Number(b.from) || 0,
      to: Number(b.to) || 0,
      content: String(b.content ?? '').trim(),
      sid: Number(b.sid) || 0,
      lang: chosen.lan_doc || chosen.lan || 'zh-CN',
    })).filter((c) => c.content.length > 0);

    return corsWrap(
      jsonResponse({
        cues,
        aiType: Number(chosen.ai_type ?? chosen.type ?? 0),
      })
    );
  } catch (e: any) {
    return corsWrap(errorResponse('fetch_subtitle_failed', undefined, 502, e?.message));
  }
}