import type { Settings, SubtitleCue, InterpretedCue } from '@/types';
import {
  SYSTEM_PROMPT,
  buildSubtitlePayload,
  buildReducePrompt,
  buildChatMessages,
} from '@/prompts/interpreter';
import { jsonrepair } from 'jsonrepair';

export interface ProgressEvent {
  stage: 'fetching' | 'interpreting' | 'streaming' | 'done';
  message?: string;
  kind?: 'summary-chunk' | 'cues-delta' | 'progress';
  chunk?: string;
  cues?: InterpretedCue[];
}

export interface InterpretationResult {
  summary: string;
  cues: InterpretedCue[];
  /** AI 原始响应(JSON 解析失败时填充,用于 UI 调试展示) */
  rawResponse?: string;
  /** JSON 解析失败的错误信息 */
  parseError?: string;
}

interface InterpretArgs {
  subtitles: SubtitleCue[];
  focus: string;
  settings: Settings;
  onProgress?: (e: ProgressEvent) => void;
}

/**
 * 拼出 Chat Completions 完整 URL。
 * - 默认用 settings.chatPath(随厂商自动维护)
 * - 若老数据没有 chatPath 字段,按 baseUrl 自动回退(MiniMax 域走专有端点,其余走 OpenAI 标准端点)
 */
function buildChatUrl(baseUrl: string, chatPath?: string): string {
  const base = baseUrl.replace(/\/$/, '');
  if (chatPath && chatPath.trim()) {
    return `${base}${chatPath.startsWith('/') ? chatPath : '/' + chatPath}`;
  }
  // 回退:按 baseUrl 域名启发式判断
  const path = /minimaxi\.com/i.test(base) ? '/text/chatcompletion_v2' : '/chat/completions';
  return `${base}${path}`;
}

/**
 * 切片参数:8 分钟一片,最多 4 片。
 */
const CHUNK_SEC = 480;
const MAX_CHUNKS = 4;

function chunkSubtitles(subs: SubtitleCue[]): SubtitleCue[][] {
  if (!subs.length) return [];
  const first = subs[0].from;
  const last = subs[subs.length - 1].to;
  const total = Math.max(1, last - first);
  const chunkSpan = Math.max(CHUNK_SEC, Math.ceil(total / MAX_CHUNKS));
  const chunks: SubtitleCue[][] = [];
  let cur: SubtitleCue[] = [];
  let curEnd = first + chunkSpan;
  for (const s of subs) {
    if (s.from >= curEnd && cur.length) {
      chunks.push(cur);
      cur = [];
      curEnd = s.from + chunkSpan;
      if (chunks.length >= MAX_CHUNKS - 1) break;
    }
    cur.push(s);
  }
  if (cur.length) chunks.push(cur);
  // 如果还有剩余,塞进最后一片
  const usedCount = chunks.reduce((acc, c) => acc + c.length, 0);
  if (usedCount < subs.length) {
    const remaining = subs.slice(usedCount);
    if (chunks.length) {
      chunks[chunks.length - 1] = [...chunks[chunks.length - 1], ...remaining];
    } else {
      chunks.push(remaining);
    }
  }
  return chunks;
}

/**
 * 把 AI 文本回复尝试解析为 JSON。
 * 多种策略依次尝试,提升成功率:
 *  1. 严格 JSON.parse
 *  2. ```json ... ``` 代码块剥离
 *  3. 提取首个「平衡的大括号」块
 *  4. 用 jsonrepair 修复小错误(缺失引号、多余逗号、未闭合括号等)
 */
function parseAiJson<T = any>(text: string): T {
  const raw = text ?? '';
  const candidates: string[] = [];

  // 候选 0:原文
  candidates.push(raw.trim());

  // 候选 1:去掉 markdown 代码块
  let s = raw.trim();
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) candidates.push(fenceMatch[1].trim());

  // 候选 2:用平衡大括号提取首个 JSON 对象
  const balanced = extractFirstBalancedJson(s);
  if (balanced) candidates.push(balanced);

  let lastErr: unknown = null;
  for (const cand of candidates) {
    if (!cand) continue;
    try {
      return JSON.parse(cand) as T;
    } catch (e) {
      lastErr = e;
    }
    // jsonrepair 兜底
    try {
      return JSON.parse(jsonrepair(cand)) as T;
    } catch (e) {
      lastErr = e;
    }
  }

  // 全部失败,抛出带原始内容的错误
  const preview = raw.length > 600 ? raw.slice(0, 600) + '...(已截断)' : raw;
  const err = new Error(`AI 返回内容无法解析为 JSON。原始内容:\n${preview}`);
  (err as any).rawResponse = raw;
  throw err;
}

/**
 * 从字符串中提取首个「平衡的」JSON 对象(支持嵌套对象/数组/字符串)。
 * 比正则 /\{[\s\S]*\}/ 更精准,避免贪婪匹配跨多个对象的问题。
 */
function extractFirstBalancedJson(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

/**
 * 调用 MiniMax API,流式读取 SSE。
 * 返回完整文本。
 */
async function callChatCompletionStream(args: {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  signal?: AbortSignal;
}): Promise<string> {
  const url = `${args.baseUrl.replace(/\/$/, '')}/text/chatcompletion_v2`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      temperature: args.temperature,
      stream: true,
    }),
    signal: args.signal,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error?.message || j?.message || JSON.stringify(j).slice(0, 200);
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`AI 接口错误 ${res.status}: ${detail || res.statusText}`);
  }
  if (!res.body) throw new Error('AI 接口无响应体');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload);
        const delta = j?.choices?.[0]?.delta?.content ?? '';
        if (delta) full += delta;
      } catch {
        // 忽略单行解析失败
      }
    }
  }
  return full;
}

/**
 * 调用 MiniMax API,非流式(用于 Reduce 阶段,简单一点)。
 */
async function callChatCompletionOnce(args: {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  chatPath?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const url = buildChatUrl(args.baseUrl, args.chatPath);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      temperature: args.temperature,
      stream: false,
    }),
    signal: args.signal,
  });
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error?.message || j?.message || JSON.stringify(j).slice(0, 200);
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`AI 接口错误 ${res.status}: ${detail || res.statusText}`);
  }
  const j = await res.json();
  return j?.choices?.[0]?.message?.content ?? '';
}

/**
 * 单块解读:整段字幕一次性给模型,流式读取 summary,Reduce 阶段合并 cues。
 * 实际实现:为简化,一次性让模型输出 JSON(非流式),但分块逻辑仍然保留。
 */
export async function interpretVideo(args: InterpretArgs): Promise<InterpretationResult> {
  const { subtitles, focus, settings, onProgress } = args;
  if (!subtitles.length) {
    return { summary: '(无字幕)', cues: [] };
  }

  if (!settings.useChunked || subtitles.length < 80) {
    // 单块模式
    onProgress?.({ stage: 'interpreting', message: 'AI 正在分析...' });
    const userPayload = buildSubtitlePayload(subtitles, focus);
    const text = await callChatCompletionOnce({
      baseUrl: settings.baseUrl,
      chatPath: settings.chatPath,
      apiKey: settings.apiKey,
      model: settings.model,
      temperature: settings.temperature,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPayload },
      ],
    });
    onProgress?.({ stage: 'streaming', message: '正在解析结果...' });
    try {
      const parsed = parseAiJson<InterpretationResult>(text);
      return {
        summary: parsed.summary ?? '',
        cues: Array.isArray(parsed.cues) ? parsed.cues : [],
      };
    } catch (e: any) {
      return {
        summary: '',
        cues: [],
        rawResponse: text,
        parseError: e?.message || 'JSON 解析失败',
      };
    }
  }

  // 分块 Map-Reduce
  const chunks = chunkSubtitles(subtitles);
  onProgress?.({
    stage: 'interpreting',
    message: `已切分为 ${chunks.length} 段,正在并行分析...`,
  });

  const mapResults: { chunkIndex: number; payload: string }[] = [];

  // Map 阶段 - 串行(避免触发限流)
  for (let i = 0; i < chunks.length; i++) {
    const sub = chunks[i];
    onProgress?.({
      stage: 'interpreting',
      message: `正在分析第 ${i + 1}/${chunks.length} 段...`,
    });
    const userPayload = buildSubtitlePayload(sub, focus);
    const text = await callChatCompletionOnce({
      baseUrl: settings.baseUrl,
      chatPath: settings.chatPath,
      apiKey: settings.apiKey,
      model: settings.model,
      temperature: settings.temperature,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPayload },
      ],
    });
    mapResults.push({ chunkIndex: i, payload: text });
  }

  // Reduce 阶段
  if (chunks.length === 1) {
    onProgress?.({ stage: 'streaming', message: '正在解析结果...' });
    try {
      const parsed = parseAiJson<InterpretationResult>(mapResults[0].payload);
      return {
        summary: parsed.summary ?? '',
        cues: Array.isArray(parsed.cues) ? parsed.cues : [],
      };
    } catch (e: any) {
      return {
        summary: '',
        cues: [],
        rawResponse: mapResults[0].payload,
        parseError: e?.message || 'JSON 解析失败',
      };
    }
  }

  onProgress?.({ stage: 'interpreting', message: '正在合并各段结果...' });
  const reduceText = await callChatCompletionOnce({
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey,
    model: settings.model,
    temperature: Math.max(0.1, settings.temperature - 0.2),
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildReducePrompt(mapResults) },
    ],
  });
  onProgress?.({ stage: 'streaming', message: '正在解析结果...' });
  try {
    const parsed = parseAiJson<InterpretationResult>(reduceText);
    return {
      summary: parsed.summary ?? '',
      cues: Array.isArray(parsed.cues) ? parsed.cues : [],
    };
  } catch (e: any) {
    return {
      summary: '',
      cues: [],
      rawResponse: reduceText,
      parseError: e?.message || 'JSON 解析失败',
    };
  }
}

// ============================================================
// 追问(Q&A)相关
// ============================================================

export interface ChatProgressEvent {
  kind: 'delta' | 'done' | 'error';
  /** 本次增量片段(可空) */
  chunk?: string;
  /** 累计内容(便于 store 直接 setState) */
  full?: string;
  /** 错误时的错误信息 */
  error?: string;
}

export interface ChatArgs {
  /** 字幕(可能为空,如从历史加载时) */
  subtitles: SubtitleCue[];
  /** 关注点 */
  focus: string;
  /** 全局 summary(解读阶段产出) */
  summary: string;
  /** cues */
  cues?: InterpretedCue[];
  /** 视频标题 */
  videoTitle?: string;
  /** 当前消息之前的对话历史(不含当前 user 消息) */
  history: { role: 'user' | 'assistant' | 'system'; content: string }[];
  /** 当前 user 消息 */
  userMessage: string;
  settings: Settings;
  signal?: AbortSignal;
  onProgress?: (e: ChatProgressEvent) => void;
}

/** 历史窗口:发送给 AI 时只取最近 6 条(3 轮 user+assistant) */
const CHAT_HISTORY_WINDOW = 6;

/**
 * 追问(基于视频内容的对话),流式返回 AI 回答。
 * 任何时刻可通过 signal.abort() 中断,中断会抛出 AbortError。
 */
export async function chatAboutVideo(args: ChatArgs): Promise<{ content: string }> {
  const { subtitles, focus, summary, cues, videoTitle, history, userMessage, settings, signal, onProgress } = args;

  // 截取最近历史
  const recentHistory = history.slice(-CHAT_HISTORY_WINDOW);

  const messages = buildChatMessages({
    videoTitle,
    focus,
    summary,
    cues,
    subtitles,
    history: recentHistory,
    userMessage,
  });

  const url = buildChatUrl(settings.baseUrl, settings.chatPath);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: settings.temperature,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j?.error?.message || j?.message || JSON.stringify(j).slice(0, 200);
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`AI 接口错误 ${res.status}: ${detail || res.statusText}`);
  }
  if (!res.body) throw new Error('AI 接口无响应体');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') continue;
        try {
          const j = JSON.parse(payload);
          const delta = j?.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            full += delta;
            onProgress?.({ kind: 'delta', chunk: delta, full });
          }
        } catch {
          // 忽略单行解析失败
        }
      }
    }
    onProgress?.({ kind: 'done', full });
    return { content: full };
  } catch (err: any) {
    if (err?.name === 'AbortError' || /aborted/i.test(err?.message ?? '')) {
      onProgress?.({ kind: 'error', full, error: '已停止' });
    } else {
      onProgress?.({ kind: 'error', full, error: err?.message || '未知错误' });
    }
    throw err;
  }
}