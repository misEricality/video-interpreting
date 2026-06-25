/**
 * 使用 Web Crypto API 在浏览器本地加密/解密 API Key。
 *
 * 安全模型:
 *   - 用 PBKDF2(userAgent + locationOrigin 作为输入材料 + 一个随机 salt)派生 AES-256-GCM 密钥。
 *   - 加密结果以 base64 形式存 localStorage(包含 salt + iv + ciphertext)。
 *
 * 注:此加密仅能防止:
 *   - DevTools 一眼看到明文
 *   - 浏览器同步带来的泄露
 *   - 普通 localStorage 拖库
 *
 * 不能防:
 *   - 同源脚本(已被 XSS 注入的页面可直接调用 decryptApiKey)
 *   - 用户本机主动查看
 *
 * 因此 SettingsDrawer 必须告知用户真实风险。
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_PREFIX = 'vi.crypto.salt.v1';

const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * 包装 Uint8Array 为 BufferSource(绕过 TS 5.7+ 对 ArrayBufferLike 的严格检查)
 */
function toBufferSource(bytes: Uint8Array): BufferSource {
  // 创建一个新的 Uint8Array 确保 backing 是 ArrayBuffer
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function getFingerprint(): string {
  return `${navigator.userAgent}|${window.location.origin}`;
}

function getOrCreateSalt(): Uint8Array {
  const key = SALT_PREFIX;
  const existing = localStorage.getItem(key);
  if (existing) {
    return base64ToBytes(existing);
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(key, bytesToBase64(salt));
  return salt;
}

async function deriveKey(): Promise<CryptoKey> {
  const salt = getOrCreateSalt();
  const material = await crypto.subtle.importKey(
    'raw',
    toBufferSource(enc.encode(getFingerprint())),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: toBufferSource(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 加密字符串,返回 base64(salt_iv_ciphertext)。
 * 这里 salt 是从 localStorage 取的固定 salt,只存一次;但每次加密都生成新的随机 iv。
 */
export async function encryptString(plain: string): Promise<string> {
  if (!plain) return '';
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toBufferSource(iv) },
    key,
    toBufferSource(enc.encode(plain))
  );
  const ivB64 = bytesToBase64(iv);
  const cipherBytes = new Uint8Array(cipher);
  const cipherB64 = bytesToBase64(cipherBytes);
  return `${ivB64}.${cipherB64}`;
}

/**
 * 解密由 encryptString 生成的字符串。
 * 失败返回空串。
 */
export async function decryptString(payload: string): Promise<string> {
  if (!payload) return '';
  try {
    const [ivB64, cipherB64] = payload.split('.');
    if (!ivB64 || !cipherB64) return '';
    const key = await deriveKey();
    const iv = base64ToBytes(ivB64);
    const cipher = base64ToBytes(cipherB64);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toBufferSource(iv) },
      key,
      toBufferSource(cipher)
    );
    return dec.decode(plain);
  } catch (e) {
    console.warn('[crypto] decrypt failed:', e);
    return '';
  }
}