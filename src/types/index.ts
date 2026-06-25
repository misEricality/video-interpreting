// 字幕原始条目(从 B 站解析后)
export interface SubtitleCue {
  /** 起始秒(浮点) */
  from: number;
  /** 结束秒(浮点) */
  to: number;
  /** 字幕文本 */
  content: string;
  /** 字幕序号 */
  sid: number;
  /** 语言标识,如 zh-CN / en-US */
  lang: string;
}

// AI 解读后的单个时间段片段
export interface InterpretedCue {
  /** 起始时间(秒) */
  start: number;
  /** 结束时间(秒) */
  end: number;
  /** 引用字幕原文 */
  quote: string;
  /** AI 解读(2-4 句) */
  takeaway: string;
  /** 与关注点的关联说明 */
  relevance: string;
}

// 视频元信息
export interface VideoMeta {
  aid: number;
  cid: number;
  title: string;
  /** 时长(秒) */
  duration: number;
  /** 分P数 */
  pages: number;
}

// 追问消息
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** 流式状态(仅 assistant 消息使用) */
  status: 'streaming' | 'done' | 'error';
  /** 失败时的错误信息 */
  error?: string;
  /** 重新生成标记(给 user 消息,UI 提示) */
  regenerated?: boolean;
}

// 当前对话状态
export interface CurrentConversation {
  id?: string;
  bvid: string;
  url: string;
  videoTitle?: string;
  focus: string;
  videoMeta: VideoMeta;
  subtitles: SubtitleCue[];
  summary: string;
  cues: InterpretedCue[];
  /** AI 字幕? */
  aiSubtitle: boolean;
  createdAt: number;
  /** 调试用:AI 原始响应(解析失败时填充) */
  rawAiResponse?: string;
  /** 追问消息列表(可空,旧数据不存) */
  chatMessages?: ChatMessage[];
}

// 历史记录(不含全量字幕)
export interface Conversation extends CurrentConversation {
  id: string;
}

// 设置
export interface Settings {
  apiKey: string; // 加密后存储的密文(若 rememberKey),否则为空
  baseUrl: string; // 默认 https://api.minimaxi.com/v1
  model: string; // 默认 MiniMax-M3
  temperature: number; // 默认 0.4
  useChunked: boolean; // 默认 true
  rememberKey: boolean; // 默认 false
  sessdata: string; // 加密后存储的密文(若 rememberSessdata),B 站登录 Cookie
  rememberSessdata: boolean; // 默认 false
}

// 默认设置
export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.minimaxi.com/v1',
  model: 'MiniMax-M3',
  temperature: 0.4,
  useChunked: true,
  rememberKey: false,
  sessdata: '',
  rememberSessdata: false,
};

// 加载状态
export type LoadingStage = 'idle' | 'fetching' | 'interpreting' | 'streaming' | 'done';

export interface LoadingState {
  stage: LoadingStage;
  /** 进度提示文本 */
  message?: string;
  error?: string;
}

// API 错误码
export interface ApiError {
  error: string;
  code?: number;
  detail?: string;
}