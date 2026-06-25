/**
 * 本地开发用 Express 代理服务器。
 * 模拟 Cloudflare Pages Functions 的行为,把 /api/bili/* 代理到 api.bilibili.com。
 *
 * 启动: node --import tsx server/dev-proxy.ts
 * 或:   npx tsx server/dev-proxy.ts
 *
 * 与 wrangler pages dev 的等价接口,只是运行平台不同(Express vs Workers)。
 */
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';

const PORT = 8799;

const BASE_BILI_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Referer: 'https://www.bilibili.com',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

/**
 * 把请求里的 sessdata 拼成 B 站可用的 Cookie 字符串。
 * 简化处理:只信任这一个字段(其他 B 站 cookie 与请求强相关,加上反而会出问题)。
 */
function biliHeaders(req: Request): Record<string, string> {
  const sessdata = String(req.query.sessdata || req.body?.sessdata || '').trim();
  if (!sessdata) return { ...BASE_BILI_HEADERS };
  return {
    ...BASE_BILI_HEADERS,
    Cookie: `SESSDATA=${sessdata}`,
  };
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/bili/aid', async (req: Request, res: Response) => {
  const bvid = String(req.query.bvid || '');
  if (!/^BV[1-9A-HJ-NP-Za-km-z]{10}$/.test(bvid)) {
    return res.status(400).json({ error: 'invalid bvid', detail: 'BV 号格式不正确' });
  }

  try {
    const headers = biliHeaders(req);
    const [pageListRes, viewRes] = await Promise.all([
      fetch(`https://api.bilibili.com/x/player/pagelist?bvid=${bvid}`, { headers }),
      fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, { headers }),
    ]);

    const pageList: any = await pageListRes.json().catch(() => null);
    const view: any = await viewRes.json().catch(() => null);

    if (!pageList || pageList.code !== 0) {
      return res.status(502).json({
        error: 'pagelist_failed',
        code: pageList?.code,
        detail: pageList?.message || 'B 站接口返回错误(分P列表)',
      });
    }
    if (!view || view.code !== 0) {
      return res.status(502).json({
        error: 'view_failed',
        code: view?.code,
        detail: view?.message || 'B 站接口返回错误(视频信息)',
      });
    }

    const firstPage = pageList.data?.[0];
    if (!firstPage?.cid) {
      return res.status(404).json({ error: 'no_page', detail: '未找到分P信息' });
    }

    return res.json({
      aid: view.data?.aid ?? 0,
      cid: firstPage.cid,
      title: view.data?.title ?? '',
      duration: view.data?.duration ?? firstPage.duration ?? 0,
      pages: pageList.data?.length ?? 1,
    });
  } catch (e: any) {
    return res.status(502).json({ error: 'fetch_failed', detail: e?.message || '请求 B 站失败' });
  }
});

app.get('/api/bili/subtitle', async (req: Request, res: Response) => {
  const bvid = String(req.query.bvid || '');
  const cidStr = String(req.query.cid || '');
  if (!bvid || !cidStr) {
    return res.status(400).json({ error: 'missing_params', detail: '需要 bvid 和 cid' });
  }
  const cid = Number(cidStr);
  if (!Number.isFinite(cid)) {
    return res.status(400).json({ error: 'invalid_cid', detail: 'cid 格式不正确' });
  }

  try {
    const headers = biliHeaders(req);
    const url = `https://api.bilibili.com/x/player/wbi/v2?bvid=${bvid}&cid=${cid}`;
    const r = await fetch(url, { headers });
    const playerJson: any = await r.json();

    if (!playerJson || playerJson.code !== 0) {
      return res.status(502).json({
        error: 'player_failed',
        code: playerJson?.code,
        detail: playerJson?.message || `B 站字幕接口返回错误(code=${playerJson?.code})`,
      });
    }

    const subs: any[] = playerJson.data?.subtitle?.subtitles ?? [];
    if (!subs.length) {
      const detail = playerJson.data?.need_login_subtitle
        ? '字幕需要登录 B 站账号。请在「设置」填入 SESSDATA(你自己的 B 站 Cookie)。'
        : '该视频暂无可用字幕(可能为充电/付费视频,或 UP 主未上传字幕)';
      return res.status(404).json({ error: 'no_subtitle', detail });
    }

    const human = subs.find((s) => (s.ai_type === 0 || s.type === 0) && !s.ai_subtitle);
    const chosen = human ?? subs[0];

    let subUrl: string = chosen.subtitle_url ?? '';
    if (subUrl.startsWith('//')) subUrl = 'https:' + subUrl;
    if (!subUrl.startsWith('http')) {
      return res.status(502).json({ error: 'bad_subtitle_url', detail: '字幕 URL 无法解析' });
    }

    const subRes = await fetch(subUrl, { headers });
    const subJson: any = await subRes.json();
    const body: any[] = Array.isArray(subJson?.body) ? subJson.body : [];

    const cues = body
      .map((b: any) => ({
        from: Number(b.from) || 0,
        to: Number(b.to) || 0,
        content: String(b.content ?? '').trim(),
        sid: Number(b.sid) || 0,
        lang: chosen.lan_doc || chosen.lan || 'zh-CN',
      }))
      .filter((c) => c.content.length > 0);

    return res.json({ cues, aiType: Number(chosen.ai_type ?? chosen.type ?? 0) });
  } catch (e: any) {
    return res.status(502).json({ error: 'fetch_subtitle_failed', detail: e?.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// 监听 0.0.0.0:PORT 同时覆盖 IPv4 127.0.0.1 和 IPv6 ::1,避免 Windows 下 localhost 解析差异导致 ECONNREFUSED
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[dev-proxy] listening on http://localhost:${PORT} (all interfaces)`);
  console.log(`[dev-proxy] try: curl 'http://127.0.0.1:${PORT}/api/bili/aid?bvid=BV1GJ411x7h7'`);
});