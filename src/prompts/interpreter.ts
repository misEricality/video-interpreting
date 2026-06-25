import type { SubtitleCue, InterpretedCue } from '@/types';

export const SYSTEM_PROMPT = `你是一名严谨的视频内容解读助手,擅长把长视频的字幕整理为结构化笔记。

任务分两部分:
1) 总结视频主要内容(150-300 字,中文)
2) 根据用户给定的「关注点」,从字幕中找出与关注点高度相关的片段,
   每条片段包含:
   - start: 起始时间(秒,浮点)
   - end: 结束时间(秒,浮点)
   - quote: 引用字幕原文(可合并连续同主题的若干条,保持原顺序)
   - takeaway: 你对这一段的解读(2-4 句,中文)
   - relevance: 与关注点的关联说明(1 句)

如果视频与关注点无关,relevance 字段写"未涉及",cues 输出空数组。

严格以 JSON 输出,不要任何额外说明、不要 markdown 代码块,格式:
{
  "summary": "...",
  "cues": [
    { "start": 12.5, "end": 48.3, "quote": "...", "takeaway": "...", "relevance": "..." }
  ]
}`;

/**
 * 把字幕序列化成可发给模型的纯文本(带时间戳)。
 */
export function buildSubtitlePayload(subs: SubtitleCue[], focus: string): string {
  const lines = subs.map((s) => {
    const ts = `[${formatSec(s.from)} - ${formatSec(s.to)}] ${s.content}`;
    return ts;
  });
  return [
    `用户关注点: ${focus || '(无特定关注点,请总结视频主要内容并提取关键信息)'}`,
    '',
    '字幕(按时间顺序):',
    ...lines,
  ].join('\n');
}

/**
 * Reduce 阶段的 prompt:合并多段局部 cues,生成全局 summary,并去重排序。
 */
export function buildReducePrompt(localResults: { chunkIndex: number; payload: string }[]): string {
  const parts = localResults
    .map((r) => `--- Chunk ${r.chunkIndex} ---\n${r.payload}`)
    .join('\n\n');
  return [
    '以下是视频被分块解读的多个局部结果。请合并并生成最终输出:',
    '1) 生成一个 150-300 字的全局视频总结(中文)',
    '2) 整合所有局部 cues,去重(同主题合并),按时间升序排序',
    '3) 如果有 cue 的 relevance 是"未涉及",也保留,但放最后',
    '',
    '严格以 JSON 输出,不要任何额外说明:',
    '{ "summary": "...", "cues": [ { "start", "end", "quote", "takeaway", "relevance" } ] }',
    '',
    parts,
  ].join('\n');
}

function formatSec(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

// ============================================================
// 追问(Q&A)相关
// ============================================================

/** 静态部分(身份 + 行为约束) */
export const CHAT_SYSTEM_PROMPT_HEADER = `你是一名严谨的视频内容解读助手,正在与用户就刚才解读过的视频展开讨论。
回答要求:
- 优先基于视频字幕原文与已生成的总结回答
- 涉及具体内容时,主动引用时间戳(秒数或 mm:ss 格式)与简短原文片段
- 简短直接,默认 1-3 段;用户明确要求详细时再展开
- 不确定的内容请明确说"视频未明确提及",不要编造
- 使用中文回复`;

/** 把字幕序列化为文本块(头尾各取一段,中间省略) */
export function buildSubtitleBlock(subs: SubtitleCue[]): string {
  if (!subs || subs.length === 0) {
    return '(本视频无可用字幕原文,以下回答仅基于总结)';
  }
  const LINES_HEAD = 80;
  const LINES_TAIL = 40;
  if (subs.length <= LINES_HEAD + LINES_TAIL) {
    return subs.map((s) => `[${formatSec(s.from)} - ${formatSec(s.to)}] ${s.content}`).join('\n');
  }
  const head = subs.slice(0, LINES_HEAD);
  const tail = subs.slice(subs.length - LINES_TAIL);
  const omitted = subs.length - LINES_HEAD - LINES_TAIL;
  const fmt = (arr: SubtitleCue[]) =>
    arr.map((s) => `[${formatSec(s.from)} - ${formatSec(s.to)}] ${s.content}`).join('\n');
  return `${fmt(head)}\n...(中间省略 ${omitted} 条字幕)...\n${fmt(tail)}`;
}

/** 构造完整 system 消息体,作为追问的上下文 */
export function buildChatSystemPrompt(args: {
  videoTitle?: string;
  focus: string;
  summary: string;
  cues?: InterpretedCue[];
  subtitles: SubtitleCue[];
}): string {
  const parts: string[] = [CHAT_SYSTEM_PROMPT_HEADER, ''];

  if (args.videoTitle) {
    parts.push(`【视频标题】${args.videoTitle}`);
  }
  parts.push(`【关注点】${args.focus || '(无特定关注点)'}`);
  if (args.summary) {
    parts.push('', '【已生成的视频总结】', args.summary);
  }
  if (args.cues && args.cues.length) {
    const top = args.cues.slice(0, 5);
    parts.push(
      '',
      '【已定位的与关注点相关片段(节选)】',
      top
        .map(
          (c, i) =>
            `${i + 1}. [${formatSec(c.start)} - ${formatSec(c.end)}] ${c.takeaway}${
              c.relevance ? `\n   关联:${c.relevance}` : ''
            }`
        )
        .join('\n')
    );
  }
  parts.push('', '【视频字幕(节选)】', buildSubtitleBlock(args.subtitles));

  return parts.join('\n');
}

/** 构造完整的 messages 数组(系统提示 + 历史 + 当前 user) */
export function buildChatMessages(args: {
  videoTitle?: string;
  focus: string;
  summary: string;
  cues?: InterpretedCue[];
  subtitles: SubtitleCue[];
  history: { role: 'user' | 'assistant' | 'system'; content: string }[];
  userMessage: string;
}): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  return [
    {
      role: 'system',
      content: buildChatSystemPrompt({
        videoTitle: args.videoTitle,
        focus: args.focus,
        summary: args.summary,
        cues: args.cues,
        subtitles: args.subtitles,
      }),
    },
    ...args.history,
    { role: 'user', content: args.userMessage },
  ];
}