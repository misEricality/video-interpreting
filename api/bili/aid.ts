// GET /api/bili/aid?bvid=xxx[&sessdata=xxx]
// 返回 { aid, cid, title, duration, pages }
// 可选 sessdata:登录 B 站后的 Cookie 值,用于访问登录/付费内容
//
// Vercel Edge runtime:Web API 风格(Request/Response/fetch)

import { BILI_HEADERS, corsWrap, errorResponse, handleOptions, jsonResponse } from '../_utils/cors';

// 关键:声明 Edge runtime,否则默认 Node.js runtime 会要求 VercelRequest/VercelResponse
export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return handleOptions();

  const url = new URL(request.url);
  const bvid = url.searchParams.get('bvid');
  const sessdata = url.searchParams.get('sessdata')?.trim() || '';

  if (!bvid || !/^BV[1-9A-HJ-NP-Za-km-z]{10}$/.test(bvid)) {
    return corsWrap(errorResponse('invalid bvid', undefined, 400, 'BV 号格式不正确'));
  }

  const headers: Record<string, string> = sessdata
    ? { ...BILI_HEADERS, Cookie: `SESSDATA=${sessdata}` }
    : { ...BILI_HEADERS };

  try {
    const [pageListRes, viewRes] = await Promise.all([
      fetch(`https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`, { headers }),
      fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, { headers }),
    ]);

    const pageList = await pageListRes.json().catch(() => null);
    const view = await viewRes.json().catch(() => null);

    if (!pageList || pageList.code !== 0) {
      return corsWrap(
        errorResponse(
          'pagelist_failed',
          pageList?.code,
          502,
          pageList?.message || 'B 站接口返回错误(分P列表)'
        )
      );
    }
    if (!view || view.code !== 0) {
      return corsWrap(
        errorResponse(
          'view_failed',
          view?.code,
          502,
          view?.message || 'B 站接口返回错误(视频信息)'
        )
      );
    }

    const firstPage = pageList.data?.[0];
    if (!firstPage?.cid) {
      return corsWrap(errorResponse('no_page', undefined, 404, '未找到分P信息'));
    }

    return corsWrap(
      jsonResponse({
        aid: view.data?.aid ?? 0,
        cid: firstPage.cid,
        title: view.data?.title ?? '',
        duration: view.data?.duration ?? firstPage.duration ?? 0,
        pages: pageList.data?.length ?? 1,
      })
    );
  } catch (e: any) {
    return corsWrap(errorResponse('fetch_failed', undefined, 502, e?.message || '请求 B 站失败'));
  }
}