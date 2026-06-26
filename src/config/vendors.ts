/**
 * AI 厂商配置 - 用户在"模型"框里直接填模型名,baseUrl 按前缀自动映射。
 *
 * 模型清单对齐 TRAE 当前预置列表(2026-06):
 *   https://docs.trae.cn/ide/models
 *
 * 顺序按用户偏好:DeepSeek → Doubao → GLM → Kimi → MiniMax。
 *
 * - 选择/输入模型时,baseUrl 自动填入对应厂商(用户可手动覆盖)
 * - Key 输入框旁边带"申请 Key"超链接,直跳各家控制台
 * - 用户可填入任意模型 ID(本表只是建议/补全)
 *
 * 如有厂商新增/调整,改这里一处即可。
 */
export type VendorId = 'deepseek' | 'doubao' | 'glm' | 'kimi' | 'MiniMax';

export interface ModelInfo {
  /** 模型 ID(发请求时用) */
  id: string;
  /** 显示名(给用户看) */
  label: string;
  /** 简短描述,用于 hint */
  hint?: string;
}

export interface VendorInfo {
  id: VendorId;
  /** 显示名 */
  name: string;
  /** OpenAI 兼容接口的基础 URL */
  baseUrl: string;
  /**
   * Chat Completions 端点路径(拼到 baseUrl 后面)。
   * - 大多数厂商使用 OpenAI 标准 `/chat/completions`
   * - MiniMax 用自家专有 `/text/chatcompletion_v2`
   */
  chatPath: string;
  /**
   * 厂商特有的请求体附加字段(会合并进每次请求 body)。
   * - DeepSeek 关闭 V4 默认 thinking 模式(高推理深度会让响应极慢甚至卡死)
   * - 其他厂商留空
   */
  extraBody?: Record<string, unknown>;
  /** 申请 API Key 的官方页面 */
  keyUrl: string;
  /** 简短介绍(展示在设置面板) */
  description: string;
  /** 支持的模型列表(TRAE 预置 + 当前主流) */
  models: ModelInfo[];
  /** 默认选中的模型 id */
  defaultModel: string;
}

export const VENDORS: VendorInfo[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    chatPath: '/chat/completions',
    // V4 系列默认开启 thinking 模式,高推理深度会让响应极慢。
    // 字幕解读属于简单任务,直接关掉 thinking 即可。
    extraBody: { thinking: { type: 'disabled' } },
    keyUrl: 'https://platform.deepseek.com/api_keys',
    description: '深度求索,国产开源之光,价格便宜,长上下文表现好。',
    defaultModel: 'deepseek-v4-flash',
    models: [
      { id: 'deepseek-v4-pro', label: 'DeepSeek-V4 Pro', hint: 'TRAE 预置旗舰' },
      { id: 'deepseek-v4-flash', label: 'DeepSeek-V4 Flash', hint: 'TRAE 预置,极速' },
      // 兼容旧 ID(将于 2026-07-24 下线,建议迁移到 V4)
      { id: 'deepseek-chat', label: 'DeepSeek-V3 (chat)', hint: '旧 ID,即将下线' },
      { id: 'deepseek-reasoner', label: 'DeepSeek-R1 (reasoner)', hint: '旧 ID,即将下线' },
    ],
  },
  {
    id: 'doubao',
    name: 'Doubao (豆包)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    chatPath: '/chat/completions',
    keyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    description: '字节跳动豆包,火山引擎托管,中文能力强。',
    defaultModel: 'doubao-seed-2-0-pro',
    models: [
      // TRAE 预置
      { id: 'doubao-seed-2-0-code', label: 'Doubao-Seed-2.0-Code', hint: 'TRAE 预置编程' },
      { id: 'doubao-seed-1-8-251228', label: 'Doubao-Seed-1.8', hint: 'TRAE 预置通用' },
      { id: 'doubao-seed-code', label: 'Doubao-Seed-Code', hint: 'TRAE 预置编程' },
      // 同期主流
      { id: 'doubao-seed-2-0-pro', label: 'Doubao-Seed-2.0-Pro', hint: '全模态旗舰' },
      { id: 'doubao-seed-2-0-lite-260215', label: 'Doubao-Seed-2.0-Lite', hint: '轻量全模态' },
      // Seed 1.6 系列(仍可用)
      { id: 'doubao-seed-1-6-251015', label: 'Doubao-Seed-1.6 (251015)', hint: '多模态深度思考' },
      { id: 'doubao-seed-1-6-250615', label: 'Doubao-Seed-1.6 (250615)', hint: '多模态深度思考' },
      { id: 'doubao-seed-1-6-flash-250828', label: 'Doubao-Seed-1.6-Flash', hint: '极速版' },
      { id: 'doubao-seed-1-6-thinking-250715', label: 'Doubao-Seed-1.6-Thinking', hint: '深度思考' },
    ],
  },
  {
    id: 'glm',
    name: 'GLM (智谱)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    chatPath: '/chat/completions',
    keyUrl: 'https://bigmodel.cn/console/apikeys',
    description: '智谱 GLM 系列,清华系,工具调用与代码能力强。',
    defaultModel: 'glm-5',
    models: [
      // TRAE 预置
      { id: 'glm-5.1', label: 'GLM-5.1', hint: 'TRAE 预置,开源增强' },
      { id: 'glm-5v-turbo', label: 'GLM-5V-Turbo', hint: 'TRAE 预置多模态编程' },
      { id: 'glm-5', label: 'GLM-5', hint: 'TRAE 预置旗舰' },
    ],
  },
  {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1',
    chatPath: '/chat/completions',
    keyUrl: 'https://platform.moonshot.cn/console/api-keys',
    description: 'Moonshot Kimi,长文本之王,擅长中文阅读理解。',
    defaultModel: 'kimi-k2.6',
    models: [
      // TRAE 预置
      { id: 'kimi-k2.6', label: 'Kimi-K2.6', hint: 'TRAE 预置,多模态长程' },
      { id: 'kimi-k2.5', label: 'Kimi-K2.5', hint: 'TRAE 预置多模态' },
      { id: 'kimi-k2.7-code', label: 'Kimi-K2.7-Code', hint: '编程专项' },
    ],
  },
  {
    id: 'MiniMax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimaxi.com/v1',
    chatPath: '/text/chatcompletion_v2',
    keyUrl: 'https://api.minimaxi.com/user-center/basic-information/interface-key',
    description: 'MiniMax,OpenAI 兼容,本项目原始推荐。',
    defaultModel: 'MiniMax-M3',
    models: [
      // TRAE 预置
      { id: 'MiniMax-M3', label: 'MiniMax-M3', hint: 'TRAE 预置,本项目默认' },
      { id: 'MiniMax-M2.7', label: 'MiniMax-M2.7', hint: 'TRAE 预置,Agent 旗舰' },
      { id: 'MiniMax-M2.5', label: 'MiniMax-M2.5', hint: 'TRAE 预置' },
    ],
  },
];

/** id → vendor */
export const VENDOR_MAP: Record<VendorId, VendorInfo> = VENDORS.reduce(
  (acc, v) => {
    acc[v.id] = v;
    return acc;
  },
  {} as Record<VendorId, VendorInfo>
);

/** 找厂商:若 id 不识别则回退到默认(原行为: MiniMax) */
export function getVendor(id: string | undefined | null): VendorInfo {
  if (id && id in VENDOR_MAP) return VENDOR_MAP[id as VendorId];
  return VENDOR_MAP.MiniMax;
}

/**
 * 把模型名归一化,用于模糊匹配:
 * - 转小写
 * - 把 `-` / `_` / 空格 都去掉(都视作同一种分隔符)
 *
 * 例:`DeepSeek-V4-Pro` / `deepseek v4 pro` / `DeepSeek_V4_Pro` 都归一为 `deepseekv4pro`
 */
function normalizeModel(s: string): string {
  return s.toLowerCase().replace(/[-_\s]+/g, '');
}

/** 模型名是否命中某条 v 的某个 model:精确 id 或归一化后的 id/label 匹配 */
function matchModel(modelId: string, v: VendorInfo): boolean {
  const target = normalizeModel(modelId);
  return v.models.some((m) => {
    if (m.id === modelId) return true; // 精确 id 命中
    if (normalizeModel(m.id) === target) return true; // 归一化 id 命中
    if (normalizeModel(m.label) === target) return true; // 归一化 label 命中
    return false;
  });
}

/**
 * 根据模型名反查 base URL — 用户在「模型」框里输入模型名时,
 * 自动把 base URL 切到对应的厂商。
 *
 * - 精确匹配 model.id(向后兼容)
 * - 模糊匹配:不区分大小写,忽略 `-` `_` 空格,同时匹配 id 和 label
 *   例:`DeepSeek-V4-Pro` → `https://api.deepseek.com/v1`
 *      `DeepSeek V4 Pro`  → `https://api.deepseek.com/v1`
 *      `deepseekv4pro`    → `https://api.deepseek.com/v1`
 */
export function detectBaseUrlByModel(modelId: string | undefined | null): string | null {
  if (!modelId) return null;
  for (const v of VENDORS) {
    if (matchModel(modelId, v)) return v.baseUrl;
  }
  return null;
}

/**
 * 根据模型名反查 chat 端点路径(同 detectBaseUrlByModel 的逻辑)。
 */
export function detectChatPathByModel(modelId: string | undefined | null): string | null {
  if (!modelId) return null;
  for (const v of VENDORS) {
    if (matchModel(modelId, v)) return v.chatPath;
  }
  return null;
}

/**
 * 根据模型名找厂商(用于"去 XX 控制台申请 Key"链接 + 启动时纠正 settings.vendor)。
 */
export function findVendorByModel(modelId: string | undefined | null): VendorInfo | null {
  if (!modelId) return null;
  for (const v of VENDORS) {
    if (matchModel(modelId, v)) return v;
  }
  return null;
}

/**
 * 把用户输入的模型名(可能是显示名 / 大小写不同 / 多了空格下划线)规范化成
 * 厂商定义的规范 model.id(发请求时用)。
 *
 * - DeepSeek 这类厂商 API 严格要求小写 ID(传 `DeepSeek-V4-Pro` 会 400)
 * - 返回规范 id,如 `deepseek-v4-pro`、`MiniMax-M3`(原样)
 * - 命中不到任何已知模型时,返回原值(让用户自填的 ID 透传)
 */
export function canonicalModelId(modelId: string | undefined | null): string {
  if (!modelId) return '';
  for (const v of VENDORS) {
    for (const m of v.models) {
      if (m.id === modelId) return m.id;
      if (normalizeModel(m.id) === normalizeModel(modelId)) return m.id;
      if (normalizeModel(m.label) === normalizeModel(modelId)) return m.id;
    }
  }
  return modelId;
}