// WBI 签名工具 - 用于在 B 站风控升级时给接口加签。
// 算法参考:https://socialsisteryi.github.io/bilibili-API-collect/docs/misc/sign/wbi.html
//
// Edge runtime 与 Cloudflare Workers 一样,SubtleCrypto 只能算 SHA 不能算 MD5,
// 所以这里沿用纯 JS MD5 实现。

const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42,
  19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51,
  30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52,
];

function md5(input: string): string {
  // Edge runtime 的 SubtleCrypto 也不支持 MD5,只能算 SHA。
  // 这里采用纯 JS MD5 实现。
  return md5Hex(input);
}

function md5Hex(str: string): string {
  function rh(n: number) {
    let s = '';
    for (let j = 0; j <= 3; j++) {
      s += ((n >> (j * 8 + 4)) & 0x0f).toString(16) + ((n >> (j * 8)) & 0x0f).toString(16);
    }
    return s;
  }
  function ad(x: number, y: number) {
    const l = (x & 0xffff) + (y & 0xffff);
    const m = (x >> 16) + (y >> 16) + (l >> 16);
    return (m << 16) | (l & 0xffff);
  }
  function rl(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function cm(q: number, a: number, b: number, x: number, s: number, t: number) {
    return ad(rl(ad(ad(a, q), ad(x, t)), s), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cm((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cm((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cm(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cm(c ^ (b | ~d), a, b, x, s, t);
  }
  function sb(s: string) {
    const nblk = ((s.length + 8) >> 6) + 1;
    const blks: number[] = new Array(nblk * 16);
    let i: number;
    for (i = 0; i < nblk * 16; i++) blks[i] = 0;
    for (i = 0; i < s.length; i++) {
      const idx = i >> 2;
      const cur = blks[idx];
      blks[idx] = cur | (s.charCodeAt(i) << ((i % 4) * 8));
    }
    const idx2 = i >> 2;
    blks[idx2] = blks[idx2] | (0x80 << ((i % 4) * 8));
    blks[nblk * 16 - 2] = s.length * 8;
    return blks;
  }
  const x = sb(str);
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;
  let i: number;
  for (i = 0; i < x.length; i += 16) {
    const oa = a;
    const ob = b;
    const oc = c;
    const od = d;
    a = ff(a, b, c, d, x[i + 0], 7, -680876936);
    d = ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i + 10], 17, -42063);
    b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = gg(b, c, d, a, x[i + 0], 20, -373897302);
    a = gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = hh(a, b, c, d, x[i + 5], 4, -378558);
    d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = ii(a, b, c, d, x[i + 0], 6, -198630844);
    d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, x[i + 2], 22, 718787259);
    b = ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = ad(a, oa);
    b = ad(b, ob);
    c = ad(c, oc);
    d = ad(d, od);
  }
  return rh(a) + rh(b) + rh(c) + rh(d);
}

/**
 * 从 nav 接口拉取 img_url / sub_url,计算 mixin_key。
 */
async function getMixinKey(headers: Record<string, string>): Promise<string> {
  const res = await fetch('https://api.bilibili.com/x/web-interface/nav', { headers });
  if (!res.ok) throw new Error(`nav ${res.status}`);
  const j: any = await res.json();
  const imgUrl: string = j?.data?.wbi_img?.img_url ?? '';
  const subUrl: string = j?.data?.wbi_img?.sub_url ?? '';
  const tail = (url: string) => url.split('/').pop()?.split('.')[0] ?? '';
  const raw = tail(imgUrl) + tail(subUrl);
  let key = '';
  for (const i of MIXIN_KEY_ENC_TAB) {
    if (i < raw.length) key += raw[i];
  }
  return key.slice(0, 32);
}

/**
 * 给参数加 wbi 签名。
 * 注意:函数会缓存 mixin_key 5 分钟以减少请求。
 */
let cached: { key: string; expires: number } | null = null;

export async function signWbi(
  params: Record<string, string | number>,
  headers: Record<string, string>
): Promise<Record<string, string>> {
  const now = Date.now();
  if (!cached || cached.expires < now) {
    const key = await getMixinKey(headers);
    cached = { key, expires: now + 5 * 60 * 1000 };
  }
  const wts = Math.floor(now / 1000);
  const sorted: Record<string, string> = { wts: String(wts) };
  Object.keys(params)
    .sort()
    .forEach((k) => {
      const v = String(params[k]).replace(/[!'()*]/g, '');
      sorted[k] = v;
    });
  const queryStr = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const w_rid = md5(queryStr + cached.key);
  return { ...sorted, w_rid };
}