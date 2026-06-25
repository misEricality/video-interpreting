// 公共 CORS 头 & 工具 - Vercel Edge runtime 版
// Edge runtime 完全支持 Web API(Request/Response/fetch),
// 这里沿用 Cloudflare Workers 的写法,改 import 路径即可。

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export function corsWrap(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    newHeaders.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export function errorResponse(error: string, code?: number, status = 400, detail?: string) {
  return jsonResponse({ error, code, detail }, status);
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// B 站请求常用 header(模拟 Chrome 浏览器)
export const BILI_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  Referer: 'https://www.bilibili.com',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};