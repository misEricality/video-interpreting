import { create } from 'zustand';
import type {
  ChatMessage,
  Conversation,
  CurrentConversation,
  LoadingState,
  Settings,
} from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import {
  loadHistory,
  loadSettings,
  saveConversation as persistConv,
  deleteConversation as persistDelete,
  clearHistory as persistClearHistory,
  saveSettings as persistSettings,
  clearAll as persistClearAll,
} from '@/services/storage';
import { decryptString, encryptString } from '@/utils/crypto';
import { parseBvid, normalizeBiliUrl } from '@/utils/url';
import { fetchVideoMeta, fetchSubtitles } from '@/services/bilibili';
import { chatAboutVideo, interpretVideo, type ProgressEvent } from '@/services/ai';
import {
  getVendor,
  detectBaseUrlByModel,
  detectChatPathByModel,
  findVendorByModel,
  canonicalModelId,
} from '@/config/vendors';

interface AppStore {
  // ===== State =====
  settings: Settings;
  current: CurrentConversation | null;
  history: Conversation[];
  loading: LoadingState;
  drawer: { settings: boolean; history: boolean; usage: boolean };
  /** 当前 chat 流式响应的 AbortController(仅 streaming 时存在) */
  chatAbortController: AbortController | null;
  /** chat 流式状态 */
  chatStreamStatus: 'idle' | 'streaming' | 'error';

  // ===== Actions =====
  init: () => Promise<void>;

  // Settings
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  setDrawer: (kind: 'settings' | 'history' | 'usage', open: boolean) => void;

  // Run
  runInterpretation: (input: { url: string; focus: string }) => Promise<void>;

  // History
  loadFromHistory: (id: string) => void;
  removeFromHistory: (id: string) => void;
  clearAllHistory: () => void;
  clearAllData: () => Promise<void>;

  // Chat
  sendChatMessage: (text: string) => Promise<void>;
  stopChatMessage: () => void;
  clearChat: () => void;
  regenerateLastAnswer: () => Promise<void>;

  // Internal
  persistCurrent: (src?: CurrentConversation | null, generateNewId?: boolean) => void;

  // Streaming summary
  appendSummary: (chunk: string) => void;
  appendCues: (cues: CurrentConversation['cues']) => void;
  setSubtitles: (subs: CurrentConversation['subtitles']) => void;
  setVideoMeta: (meta: CurrentConversation['videoMeta']) => void;
  resetCurrent: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  current: null,
  history: [],
  loading: { stage: 'idle' },
  drawer: { settings: false, history: false, usage: false },
  chatAbortController: null,
  chatStreamStatus: 'idle',

  init: async () => {
    const persisted = loadSettings();
    // 解密敏感字段(如果存在)
    let apiKey = '';
    if (persisted.rememberKey && persisted.apiKey) {
      apiKey = await decryptString(persisted.apiKey);
    }
    let sessdata = '';
    if (persisted.rememberSessdata && persisted.sessdata) {
      sessdata = await decryptString(persisted.sessdata);
    }
    // 老数据迁移:补齐缺失/不一致的 vendor / chatPath / baseUrl / model id
    const fromModel = findVendorByModel(persisted.model);
    const expectedVendor =
      (persisted as any).vendor && (persisted as any).vendor !== 'undefined'
        ? (persisted as any).vendor
        : fromModel?.id || DEFAULT_SETTINGS.vendor;
    // 把用户填的 model(可能是显示名 / 大小写不对)规范化为厂商定义的规范 id
    const normalizedModel = canonicalModelId(persisted.model) || persisted.model;
    if (normalizedModel !== persisted.model) {
      console.info(
        '[init] 已规范化 model id:',
        { from: persisted.model, to: normalizedModel }
      );
    }
    // 先按 model 反推"应该用"的 baseUrl / chatPath
    // 优先级:model 命中的厂商 → 当前 vendor 兜底 → 默认
    // 注意:用规范化后的 model 来推(否则 fuzzy 匹配可能漏掉)
    const expectedBaseUrl =
      fromModel?.baseUrl || getVendor(expectedVendor).baseUrl || DEFAULT_SETTINGS.baseUrl;
    const expectedChatPath =
      fromModel?.chatPath ||
      detectChatPathByModel(normalizedModel) ||
      getVendor(expectedVendor).chatPath ||
      DEFAULT_SETTINGS.chatPath;
    // 只在用户值与"按当前 model 应该用的一致"时才保留,否则覆盖为正确值
    // 这样能修复:之前 MiniMax 老配置里残留的 baseUrl/chatPath 没被洗掉的问题
    const persistedBaseUrl = (persisted as any).baseUrl;
    const persistedChatPath = (persisted as any).chatPath;
    const migrated: Settings = {
      ...persisted,
      model: normalizedModel,
      // 1. 修正 vendor:如果当前 vendor 与 model 不匹配,以 model 为准
      vendor: fromModel ? fromModel.id : expectedVendor,
      apiKey,
      sessdata,
      // 2. 修正 baseUrl:不匹配就覆盖
      baseUrl: persistedBaseUrl === expectedBaseUrl ? persistedBaseUrl : expectedBaseUrl,
      // 3. 修正 chatPath:不匹配就覆盖
      chatPath: persistedChatPath === expectedChatPath ? persistedChatPath : expectedChatPath,
    };
    if (persistedBaseUrl !== expectedBaseUrl || persistedChatPath !== expectedChatPath) {
      console.info(
        '[init] 已迁移 baseUrl/chatPath:',
        { from: { baseUrl: persistedBaseUrl, chatPath: persistedChatPath } },
        { to: { baseUrl: expectedBaseUrl, chatPath: expectedChatPath } },
        'model =',
        normalizedModel,
        'vendor =',
        fromModel?.id
      );
    }
    set({
      settings: migrated,
      history: loadHistory(),
    });
  },

  updateSettings: async (patch) => {
    const prev = get().settings;
    const next: Settings = { ...prev, ...patch };
    // 切厂商时:同步 baseUrl + chatPath;老厂商/手填的 model 不在新厂商列表里时,回退到默认 model
    if (patch.vendor && patch.vendor !== prev.vendor) {
      const v = getVendor(patch.vendor);
      next.baseUrl = v.baseUrl;
      next.chatPath = v.chatPath;
      const stillValid = v.models.some((m) => m.id === next.model);
      if (!stillValid) {
        next.model = v.defaultModel;
      }
    }
    // 模型改变时:若新模型在已知厂商列表里(模糊匹配),自动同步 vendor / baseUrl / chatPath
    // (用户不再需要选厂商,只需输模型名 — 包括显示名格式如 `DeepSeek-V4-Pro`)
    if (patch.model && patch.model !== prev.model) {
      // 规范化 model id(用户可能填显示名 / 大小写不对),保证存到 settings 和发请求都用规范 id
      const canonical = canonicalModelId(patch.model);
      if (canonical && canonical !== patch.model) next.model = canonical;
      const v = findVendorByModel(next.model);
      const detectedUrl = detectBaseUrlByModel(next.model);
      const detectedPath = detectChatPathByModel(next.model);
      if (v) {
        // 同步 vendor — 保证 vendor 与模型一致
        if (v.id !== next.vendor) next.vendor = v.id;
        if (v.baseUrl !== next.baseUrl) next.baseUrl = v.baseUrl;
        if (v.chatPath !== next.chatPath) next.chatPath = v.chatPath;
      } else {
        // 模型未命中已知列表,只更新 baseUrl/chatPath(若能识别)
        if (detectedUrl && detectedUrl !== next.baseUrl) {
          next.baseUrl = detectedUrl;
        }
        if (detectedPath && detectedPath !== next.chatPath) {
          next.chatPath = detectedPath;
        }
      }
    }
    // 决定是否加密存储敏感字段
    let storedKey = next.apiKey;
    if (next.rememberKey && next.apiKey) {
      storedKey = await encryptString(next.apiKey);
    } else if (!next.rememberKey) {
      storedKey = '';
    }
    let storedSess = next.sessdata;
    if (next.rememberSessdata && next.sessdata) {
      storedSess = await encryptString(next.sessdata);
    } else if (!next.rememberSessdata) {
      storedSess = '';
    }
    const toPersist: Settings = { ...next, apiKey: storedKey, sessdata: storedSess };
    persistSettings(toPersist);
    set({ settings: next });
  },

  setDrawer: (kind, open) => {
    set({ drawer: { ...get().drawer, [kind]: open } });
  },

  runInterpretation: async ({ url, focus }) => {
    const bvid = parseBvid(url);
    if (!bvid) {
      set({
        loading: { stage: 'idle', error: '请输入有效的 Bilibili 视频链接(需包含 BV 号)' },
      });
      return;
    }
    const normalizedUrl = normalizeBiliUrl(url)!;
    const settings = get().settings;

    if (!settings.apiKey) {
      set({
        loading: {
          stage: 'idle',
          error: '请先在「设置」中填写 MiniMax API Key',
        },
        drawer: { ...get().drawer, settings: true },
      });
      return;
    }

    // 重置 current
    set({
      current: {
        bvid,
        url: normalizedUrl,
        videoTitle: '',
        focus,
        videoMeta: { aid: 0, cid: 0, title: '', duration: 0, pages: 0 },
        subtitles: [],
        summary: '',
        cues: [],
        aiSubtitle: false,
        createdAt: Date.now(),
      },
      loading: { stage: 'fetching', message: '正在获取视频信息...' },
    });

    try {
      // 阶段 1: 拿元数据
      const meta = await fetchVideoMeta(bvid, settings.sessdata);
      set({
        current: { ...get().current!, videoTitle: meta.title, videoMeta: meta },
        loading: { stage: 'fetching', message: '正在拉取视频字幕...' },
      });

      // 阶段 2: 拿字幕
      const { cues: subs, aiSubtitle } = await fetchSubtitles(bvid, meta.cid, settings.sessdata);
      if (!subs.length) {
        // 没有字幕(可能因为视频本身没字幕,或字幕需要登录)
        // 提前终止,不浪费 AI 调用。
        set({
          current: null,
          loading: {
            stage: 'idle',
            error: '很抱歉,该视频无法解读(B 站暂无可用字幕)。请在 B 站确认视频有 CC 字幕后再试。',
          },
        });
        return;
      }
      set({
        current: { ...get().current!, subtitles: subs, aiSubtitle },
        loading: { stage: 'interpreting', message: '正在让 AI 解读视频...' },
      });

      // 阶段 3: AI 解读
      const onProgress = (e: ProgressEvent) => {
        set({ loading: { stage: e.stage, message: e.message } });
        if (e.kind === 'summary-chunk' && e.chunk) {
          set({
            current: get().current
              ? { ...get().current!, summary: get().current!.summary + e.chunk }
              : null,
          });
        } else if (e.kind === 'cues-delta' && e.cues) {
          set({
            current: get().current
              ? { ...get().current!, cues: [...get().current!.cues, ...e.cues] }
              : null,
          });
        }
      };

      const result = await interpretVideo({
        subtitles: subs,
        focus: focus.trim() || '请总结视频主要内容',
        settings,
        onProgress,
      });

      // AI 成功返回
      // 若解析失败,result.rawResponse 会包含原始内容(用于调试展示)
      if (result.rawResponse && (result.parseError || (!result.summary && !result.cues.length))) {
        const raw = result.rawResponse;
        set({
          current: { ...get().current!, rawAiResponse: raw, summary: raw.slice(0, 800) + (raw.length > 800 ? '...(已截断,详见下方)' : ''), cues: [] },
          loading: {
            stage: 'done',
            error: result.parseError || 'AI 返回了内容但无法解析为 JSON,已按原文展示。',
          },
        });
        return;
      }

      const finalCurrent: CurrentConversation = {
        ...get().current!,
        summary: result.summary,
        cues: result.cues,
        createdAt: Date.now(),
      };
      set({ current: finalCurrent, loading: { stage: 'done' } });

      // 持久化(只保留 summary + cues + 元数据)
      get().persistCurrent(finalCurrent, true);
    } catch (err: any) {
      console.error('[runInterpretation] failed:', err);
      const raw = String(err?.message || '');
      // 把后端代理返回的 404 + no_subtitle 翻译成友好提示
      let message: string;
      if (raw.includes('no_subtitle')) {
        message =
          '很抱歉,该视频无法解读(B 站暂无可用字幕)。请在 B 站确认视频有 CC 字幕后再试。';
      } else if (raw.includes('need_login_subtitle')) {
        message = '该视频字幕需要登录 B 站账号才能获取。请在「设置」中填入 SESSDATA 后重试。';
      } else if (raw.includes('invalid bvid') || raw.includes('BV 号格式不正确')) {
        message = 'BV 号格式不正确,请检查链接是否完整。';
      } else if (raw.includes('fetch_failed') || raw.includes('fetch_subtitle_failed')) {
        message = '请求 B 站失败,可能是网络问题,请稍后重试。';
      } else {
        message = raw || '未知错误,请稍后重试';
      }
      set({ current: null, loading: { stage: 'idle', error: message } });
    }
  },

  loadFromHistory: (id) => {
    const item = get().history.find((c) => c.id === id);
    if (!item) return;
    set({
      current: {
        ...item,
        // 历史中不含字幕,清空
        subtitles: [],
      },
      loading: { stage: 'done' },
    });
  },

  removeFromHistory: (id) => {
    persistDelete(id);
    set({ history: loadHistory() });
  },

  clearAllHistory: () => {
    persistClearHistory();
    set({ history: [] });
  },

  clearAllData: async () => {
    persistClearAll();
    set({
      settings: { ...DEFAULT_SETTINGS },
      history: [],
      current: null,
      loading: { stage: 'idle' },
    });
  },

  // ===== 内部:将 current 持久化为一条历史记录 =====
  // 抽出来供解读完成、追问完成、重新生成完成时复用
  // generateNewId: 首次保存(解读完成)传 true,后续追问更新传 false 以保持 id 不变
  persistCurrent: (src, generateNewId = true) => {
    const cur = src ?? get().current;
    if (!cur) return;
    const id = cur.id ?? crypto.randomUUID();
    const toPersist: Conversation = {
      id,
      ...cur,
      // 移除全量字幕以节约空间
      subtitles: [],
    };
    persistConv(toPersist);
    // 同步 current.id 便于后续更新指向同一条
    if (!cur.id) {
      set({ current: { ...cur, id } });
    }
    set({ history: loadHistory() });
  },

  // ===== Chat =====

  sendChatMessage: async (text) => {
    const cur = get().current;
    if (!cur) return;
    const settings = get().settings;
    const trimmed = (text ?? '').trim();
    if (!trimmed) return;

    if (get().chatStreamStatus === 'streaming') {
      // 已有流式任务在跑,直接忽略(理论上 UI 不会触发)
      return;
    }
    if (get().loading.stage === 'fetching' || get().loading.stage === 'interpreting' || get().loading.stage === 'streaming') {
      set({
        loading: { ...get().loading, error: '解读中,稍后再问' },
      });
      return;
    }
    if (!settings.apiKey) {
      set({
        loading: { ...get().loading, error: '请先在「设置」中填写 MiniMax API Key' },
        drawer: { ...get().drawer, settings: true },
      });
      return;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
      status: 'done',
    };
    const aiMsgId = crypto.randomUUID();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      status: 'streaming',
    };

    const baseList = cur.chatMessages ?? [];
    const nextList = [...baseList, userMsg, aiMsg];

    const ctrl = new AbortController();

    set({
      current: { ...cur, chatMessages: nextList },
      chatStreamStatus: 'streaming',
      chatAbortController: ctrl,
    });

    try {
      await chatAboutVideo({
        subtitles: cur.subtitles,
        focus: cur.focus,
        summary: cur.summary,
        cues: cur.cues,
        videoTitle: cur.videoTitle,
        // 历史:不包含当前 user 和空的 assistant
        history: baseList.map((m) => ({ role: m.role, content: m.content })),
        userMessage: trimmed,
        settings,
        signal: ctrl.signal,
        onProgress: (e) => {
          if (e.kind !== 'delta' || !e.chunk) return;
          const c = get().current;
          if (!c) return;
          const msgs = [...(c.chatMessages ?? [])];
          const idx = msgs.findIndex((m) => m.id === aiMsgId);
          if (idx < 0) return;
          msgs[idx] = { ...msgs[idx], content: msgs[idx].content + e.chunk };
          set({ current: { ...c, chatMessages: msgs } });
        },
      });

      // 成功完成
      const c2 = get().current;
      if (c2) {
        const msgs = [...(c2.chatMessages ?? [])];
        const idx = msgs.findIndex((m) => m.id === aiMsgId);
        if (idx >= 0) {
          msgs[idx] = { ...msgs[idx], status: 'done' };
          set({ current: { ...c2, chatMessages: msgs }, chatStreamStatus: 'idle' });
        }
      }
      // 持久化
      get().persistCurrent();
    } catch (err: any) {
      const c3 = get().current;
      if (c3) {
        const msgs = [...(c3.chatMessages ?? [])];
        const idx = msgs.findIndex((m) => m.id === aiMsgId);
        const isAbort = err?.name === 'AbortError' || /aborted/i.test(err?.message ?? '');
        if (idx >= 0) {
          msgs[idx] = {
            ...msgs[idx],
            status: 'error',
            error: isAbort ? '已停止' : err?.message || '未知错误',
          };
          set({
            current: { ...c3, chatMessages: msgs },
            chatStreamStatus: isAbort ? 'idle' : 'error',
          });
        }
      }
    } finally {
      set({ chatAbortController: null });
    }
  },

  stopChatMessage: () => {
    const ctrl = get().chatAbortController;
    if (ctrl) {
      ctrl.abort();
    }
  },

  clearChat: () => {
    const cur = get().current;
    if (!cur) return;
    set({
      current: { ...cur, chatMessages: [] },
      chatStreamStatus: 'idle',
    });
    get().persistCurrent();
  },

  regenerateLastAnswer: async () => {
    const cur = get().current;
    if (!cur) return;
    const list = cur.chatMessages ?? [];
    if (!list.length) return;
    if (get().chatStreamStatus === 'streaming') return;

    // 找到最后一条 user 消息
    let lastUserIdx = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx < 0) return;

    const userContent = list[lastUserIdx].content;
    // 截断到最后一条 user 消息(包含)
    const newList = list.slice(0, lastUserIdx + 1).map((m) => ({ ...m }));
    // 标记 user 消息 regenerated
    if (newList.length) {
      newList[newList.length - 1] = { ...newList[newList.length - 1], regenerated: true };
    }

    set({ current: { ...cur, chatMessages: newList } });
    get().persistCurrent();

    // 复用 sendChatMessage 的逻辑
    await get().sendChatMessage(userContent);
  },

  appendSummary: (chunk) => {
    const cur = get().current;
    if (!cur) return;
    set({ current: { ...cur, summary: cur.summary + chunk } });
  },

  appendCues: (cues) => {
    const cur = get().current;
    if (!cur) return;
    set({ current: { ...cur, cues: [...cur.cues, ...cues] } });
  },

  setSubtitles: (subs) => {
    const cur = get().current;
    if (!cur) return;
    set({ current: { ...cur, subtitles: subs } });
  },

  setVideoMeta: (meta) => {
    const cur = get().current;
    if (!cur) return;
    set({ current: { ...cur, videoMeta: meta } });
  },

  resetCurrent: () => {
    set({ current: null, loading: { stage: 'idle' } });
  },
}));