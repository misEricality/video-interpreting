/**
 * AI 厂商配置 - 用于"供应商 → 模型"级联菜单。
 * 顺序按用户偏好:DeepSeek → Doubao → GLM → Kimi → MiniMax。
 *
 * - 选厂商时,baseUrl 自动填入(用户可手动覆盖)
 * - 模型下拉只显示该厂商支持的型号
 * - Key 输入框旁边带"申请 Key"超链接,直跳各家控制台
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
  /** 申请 API Key 的官方页面 */
  keyUrl: string;
  /** 简短介绍(展示在设置面板) */
  description: string;
  /** 支持的模型列表 */
  models: ModelInfo[];
  /** 默认选中的模型 id */
  defaultModel: string;
}

export const VENDORS: VendorInfo[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    description: '深度求索,国产开源之光,价格便宜,长上下文表现好。',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek-V3 (chat)', hint: '通用对话,128K 上下文' },
      { id: 'deepseek-reasoner', label: 'DeepSeek-R1 (reasoner)', hint: '强推理,思维链展示' },
    ],
  },
  {
    id: 'doubao',
    name: 'Doubao (豆包)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    keyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
    description: '字节跳动豆包,火山引擎托管,中文能力强。',
    defaultModel: 'doubao-seed-1-6-250615',
    models: [
      { id: 'doubao-seed-1-6-250615', label: 'Doubao Seed 1.6', hint: '最新通用,256K' },
      { id: 'doubao-seed-1-6-flash-250715', label: 'Doubao Seed 1.6 Flash', hint: '快速版' },
      { id: 'doubao-1-5-thinking-pro-250415', label: 'Doubao 1.5 Thinking Pro', hint: '深度思考' },
      { id: 'doubao-pro-32k', label: 'Doubao Pro 32K', hint: '经典款' },
    ],
  },
  {
    id: 'glm',
    name: 'GLM (智谱)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    keyUrl: 'https://bigmodel.cn/console/apikeys',
    description: '智谱 GLM 系列,清华系,工具调用与代码能力强。',
    defaultModel: 'glm-4-plus',
    models: [
      { id: 'glm-4-plus', label: 'GLM-4 Plus', hint: '旗舰,综合最强' },
      { id: 'glm-4-air-250414', label: 'GLM-4 Air', hint: '性价比' },
      { id: 'glm-4-flash-250414', label: 'GLM-4 Flash', hint: '免费/极速' },
      { id: 'glm-z1-air', label: 'GLM-Z1 Air', hint: '推理模型' },
    ],
  },
  {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/v1',
    keyUrl: 'https://platform.moonshot.cn/console/api-keys',
    description: 'Moonshot Kimi,长文本之王,擅长中文阅读理解。',
    defaultModel: 'moonshot-v1-128k',
    models: [
      { id: 'moonshot-v1-128k', label: 'Kimi v1 (128K)', hint: '长上下文' },
      { id: 'moonshot-v1-32k', label: 'Kimi v1 (32K)', hint: '中等长度' },
      { id: 'moonshot-v1-8k', label: 'Kimi v1 (8K)', hint: '短文本' },
      { id: 'kimi-k2-0905-preview', label: 'Kimi K2 (preview)', hint: '代码增强' },
    ],
  },
  {
    id: 'MiniMax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimaxi.com/v1',
    keyUrl: 'https://api.minimaxi.com/user-center/basic-information/interface-key',
    description: 'MiniMax,OpenAI 兼容,本项目原始推荐。',
    defaultModel: 'MiniMax-M3',
    models: [
      { id: 'MiniMax-M3', label: 'MiniMax-M3', hint: '本项目默认' },
      { id: 'abab6.5s-chat', label: 'abab6.5s chat', hint: '上一代通用' },
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
 * 根据模型 ID 反查 base URL — 用户在「模型」框里直接输入模型名时,
 * 自动把 base URL 切到对应的厂商(若模型不在任何已知列表里,返回 null)。
 *
 * 用法:用户输 `deepseek-chat` → 自动填入 `https://api.deepseek.com/v1`
 */
export function detectBaseUrlByModel(modelId: string | undefined | null): string | null {
  if (!modelId) return null;
  for (const v of VENDORS) {
    if (v.models.some((m) => m.id === modelId)) {
      return v.baseUrl;
    }
  }
  return null;
}

/**
 * 根据模型 ID 找厂商(用于"去 XX 控制台申请 Key"链接)。
 */
export function findVendorByModel(modelId: string | undefined | null): VendorInfo | null {
  if (!modelId) return null;
  for (const v of VENDORS) {
    if (v.models.some((m) => m.id === modelId)) {
      return v;
    }
  }
  return null;
}
