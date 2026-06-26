# 视频解读 · Bilibili + AI

> 输入 Bilibili 视频链接与关注点,AI 为你总结视频内容、定位相关时间段,并在解读后继续追问。  
> 内置 **DeepSeek / Doubao / GLM / Kimi / MiniMax** 五大国产模型支持,自带模糊匹配,填模型名自动切换 Base URL。

![技术栈](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel)
![License](https://img.shields.io/badge/license-MIT-blue)

**线上 Demo**:<https://video-interpreting-mine.vercel.app>

---

## 功能特性

- 🎬 **Bilibili 视频解读**:粘贴 BV 链接,自动获取视频元信息与字幕(走 Vercel Edge Functions 代理)
- 🧠 **多厂商 AI 支持**:内置 DeepSeek / Doubao / GLM / Kimi / MiniMax 五家,用户自带 API Key
- 🔍 **模型名自动识别**:在设置里输入模型名(如 `DeepSeek-V4-Pro`、`DeepSeek V4 Pro`、`deepseek_v4_pro` 都行),baseUrl / vendor / 端点路径自动匹配;大小写、空格、横线、下划线统统不敏感
- 📑 **结构化输出**:视频主要内容总结 + 与关注点相关的时间段片段(可一键跳转 B 站)
- 💬 **解读后追问 Q&A**:基于「字幕全文 + 关注点 + summary」的流式问答,可中断、可清空
- 📦 **Map-Reduce 长视频分块**:>8 分钟视频自动切片再合并,避免单次请求超 token
- 🕘 **对话历史**:本地浏览器(localStorage)保存,最多 50 条 LRU
- 🔒 **隐私优先**:无后端、API Key 经 AES-256-GCM 加密、所有数据仅在本机
- 🌗 **暗色模式**:跟随系统或手动切换
- 📱 **响应式**:PC / 平板 / 移动端自适应

---

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Vite + React 18 + TypeScript |
| 样式 | Tailwind CSS + Radix UI |
| 状态 | Zustand(persist 中间件) |
| 字幕渲染 | react-markdown + remark-gfm + rehype-sanitize |
| B 站代理 | Vercel Edge Functions(替代 Cloudflare Workers,规避 IP 风控) |
| 部署 | Vercel(静态托管 + Edge Functions) |
| AI | 多厂商 OpenAI 兼容接口(DeepSeek / Doubao / GLM / Kimi / MiniMax) |

---

## 支持的 AI 厂商

模型清单对齐 [TRAE 预置模型](https://docs.trae.cn/ide/models)(2026-06 截取)。

| 厂商 | Base URL | 端点 | 模型举例 | Key 申请 |
|---|---|---|---|---|
| **DeepSeek**(推荐) | `https://api.deepseek.com/v1` | `/chat/completions` | `deepseek-v4-pro`、`deepseek-v4-flash` | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **Doubao**(豆包) | `https://ark.cn-beijing.volces.com/api/v3` | `/chat/completions` | `doubao-seed-2-0-pro`、`doubao-seed-1-6-flash-250828` | [console.volcengine.com](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey) |
| **GLM**(智谱) | `https://open.bigmodel.cn/api/paas/v4` | `/chat/completions` | `glm-5`、`glm-5v-turbo`、`glm-5.1` | [bigmodel.cn](https://bigmodel.cn/console/apikeys) |
| **Kimi**(月之暗面) | `https://api.moonshot.cn/v1` | `/chat/completions` | `kimi-k2.6`、`kimi-k2.7-code` | [platform.moonshot.cn](https://platform.moonshot.cn/console/api-keys) |
| **MiniMax**(默认) | `https://api.minimaxi.com/v1` | `/text/chatcompletion_v2` | `MiniMax-M3`、`MiniMax-M2.7`、`MiniMax-M2.5` | [api.minimaxi.com](https://api.minimaxi.com/user-center/basic-information/interface-key) |

> 💡 **无需记忆 Base URL**:在「模型」输入框里填模型名,系统会自动匹配厂商并填好 Base URL / chatPath,你也可以手动覆盖。  
> ⚠️ **DeepSeek V4 系列默认开启 thinking 模式**,会把简单任务卡几十秒甚至超时;本项目在请求里自动注入 `thinking: { type: 'disabled' }`,无需你操心。

---

## 项目结构

```
video_interpreting/
├── src/                              # React 前端
│   ├── pages/HomePage.tsx            # 唯一页面
│   ├── components/
│   │   ├── InputBar.tsx              # URL + 关注点输入
│   │   ├── SettingsDrawer.tsx        # 设置抽屉(API Key、模型)
│   │   ├── HistoryDrawer.tsx         # 历史记录抽屉
│   │   ├── ResultView.tsx            # 解读结果(汇总 + 时间线)
│   │   ├── ChatPanel.tsx             # 解读后追问 Q&A 面板
│   │   ├── ChatMessageItem.tsx       # 单条对话气泡
│   │   ├── TimelineCue.tsx           # 单条时间戳解读卡片
│   │   ├── SubtitleList.tsx          # 原始字幕列表
│   │   ├── UsageGuide.tsx            # 使用说明(可折叠)
│   │   ├── ErrorBanner.tsx           # 错误提示
│   │   ├── SecurityNotice.tsx        # API Key 安全声明 Modal
│   │   ├── EmptyState.tsx            # 空态
│   │   ├── ThemeToggle.tsx           # 暗色模式切换
│   │   └── ui/                       # Radix 二次封装的原子组件
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Drawer.tsx
│   │       ├── Select.tsx
│   │       └── Skeleton.tsx
│   ├── services/
│   │   ├── bilibili.ts               # B站字幕拉取(经 Edge Function)
│   │   ├── ai.ts                     # 多厂商 AI 调用(Map-Reduce + 流式 Q&A)
│   │   ├── storage.ts                # localStorage 持久化(50 条 LRU)
│   │   └── time.ts                   # 秒数格式化
│   ├── store/useAppStore.ts          # Zustand 全局状态 + init 迁移
│   ├── config/
│   │   └── vendors.ts                # 多厂商配置 / 模糊匹配 / 规范化
│   ├── prompts/interpreter.ts        # AI Prompt 模板
│   ├── types/index.ts                # 类型定义(Settings / SubtitleCue / InterpretedCue / ChatMessage 等)
│   └── utils/                        # 工具(URL 解析、加密)
├── api/                              # Vercel Edge Functions(B站代理)
│   ├── _utils/
│   │   ├── cors.ts
│   │   └── wbi.ts
│   └── bili/
│       ├── aid.ts                    # GET /api/bili/aid
│       └── subtitle.ts               # GET /api/bili/subtitle
├── server/                           # 本地开发用 Express 代理(可选)
│   └── dev-proxy.ts
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── vercel.json                       # Vercel 配置(SPA fallback + 资源缓存)
├── .trae/documents/                  # 内部 plan & spec 文档
└── README.md
```

---

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动前端开发服务

```bash
npm run dev
```

访问 <http://localhost:5173>。

### 3. 启动 B 站 API 代理(可选,联调字幕接口时需要)

**方式 A:Express 代理**(无需 Vercel 账号)

另开一个终端:

```bash
npm run proxy:dev
```

代理会监听 `http://localhost:8799`,Vite 自动把 `/api/*` 转发到这里。

**方式 B:Vercel 本地模拟**(完整模拟线上环境,需登录)

```bash
npm run vercel:dev
```

首次会提示登录 Vercel,然后启动 `vercel dev`,监听 `http://localhost:3000`。  
把 `vite.config.ts` 里的代理目标从 `8799` 改为 `3000` 即可使用此模式。

> 📌 默认代理端口 **8799**。若被占用,改 `vite.config.ts` 和 `server/dev-proxy.ts` 的 `PORT`。

### 4. 构建生产包

```bash
npm run build          # tsc 类型检查 + vite build
npm run typecheck      # 仅类型检查
```

产物输出到 `dist/`。

---

## 部署到 Vercel

### 方式 A:Git 集成(推荐)

1. 推到 GitHub / GitLab。
2. 登录 [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project**。
3. 选你的仓库,点 **Import**。
4. Vercel 会自动识别 Vite,无需改配置:
   - Build Command:`npm run build`
   - Output Directory:`dist`
   - Install Command:`npm install`
5. 点 **Deploy**,自动得到域名 `https://<project>.vercel.app`。

每次 `git push` 到 `main` 自动重新部署。

### 方式 B:Vercel CLI 直传

```bash
npm install -g vercel
vercel login
npm run deploy          # 等价于 vercel --prod
```

> `vercel.json` 已配置好 SPA fallback(`/* → /index.html`)与静态资源一年缓存。

---

## 配置 API Key

部署完成、首次打开站点会弹出「安全声明」Modal,点击「我已知晓」进入主界面。

点击右上角 **⚙ 设置**:

| 字段 | 说明 |
|---|---|
| **厂商** | 下拉选择(DeepSeek / Doubao / GLM / Kimi / MiniMax) |
| **API Key** | 必填,点击旁边「申请 Key」链接可直跳对应控制台 |
| **Base URL** | 自动按厂商填好,一般无需改;自建代理或私有部署时可改 |
| **模型** | 直接填模型 ID 或显示名,大小写/横线/下划线/空格都不敏感,会自动匹配厂商和 Base URL |
| **Temperature** | 默认 0.4 |
| **启用分块 Map-Reduce** | 长视频(>8 分钟)推荐开启 |
| **记住 API Key** | 开启后经 AES-256-GCM 加密保存到本机,下次自动填充 |

> **Q&A 面板无需额外配置**,直接复用全局 API Key / Model。

---

## 使用流程

1. 粘贴 Bilibili 视频链接(支持 BV 号自动识别)
2. 输入关注点(留空则总结主要内容)
3. 点「开始解读」,等待 10 秒 ~ 数分钟(取决于视频长度 + 模型速度)
4. 查看结果:**Summary 卡片 + 时间线片段**(点时间跳 B 站)
5. 在 Q&A 面板针对视频内容继续追问
6. 完成的对话自动保存到「历史记录」

---

## 安全说明

- 所有用户数据(API Key / 历史 / 设置)仅存浏览器 localStorage,**无任何服务端持久化**
- API Key 经 PBKDF2 派生密钥 + AES-256-GCM 加密后存储(防 DevTools 一眼看到明文、防浏览器同步)
- Vercel Edge Functions **只代理 B 站字幕请求**,不会触及你的 API Key
- ⚠️ 此加密不能防同源 XSS 注入;请勿在公共/共享电脑使用

---

## 常见问题

### Q: 视频没有字幕?
A: 本应用只能解读带字幕的视频(人工或 AI 字幕均可)。B 站该视频无字幕会提示「该视频暂无可用字幕」。

### Q: AI 解读超时 / 失败?
A: 检查 API Key / Base URL / 模型名拼写 / 账户余额。  
DeepSeek V4 默认 thinking 模式已在本项目关闭,无需手动设置。  
可在设置中关闭「分块 Map-Reduce」尝试单块模式。

### Q: 「模型」填错或大小写不一致会失败吗?
A: 不会。系统在 `vendors.ts` 用 `normalizeModel` 模糊匹配:  
`DeepSeek-V4-Pro` / `DeepSeek V4 Pro` / `deepseek_v4_pro` / `DEEPSEEK V4 PRO` 都归一为 `deepseekv4pro`,命中后自动填好厂商 / Base URL / 端点路径,并把模型 ID 规范化为各厂商要求的格式(如 DeepSeek 严格要求小写)。

### Q: Vercel Edge Functions 部署失败?
A: 检查 `vercel.json` 的 `outputDirectory = dist`。Functions 代码必须在 `/api` 目录(已就位)。

### Q: 本地开发 B 站 API 报错?
A: B 站对未登录 + 无 SESSDATA 的请求有风控,可能返回 `-352` / `-101`。  
线上 Vercel Edge Functions IP 池相对干净,通常可用。仍失败时在「设置」填你自己的 B 站 Cookie SESSDATA。

### Q: 为什么从 Cloudflare Pages 改到 Vercel?
A: Cloudflare Workers 的共享 IP 段被 B 站风控拉黑,在线环境 B 站 API 返回 `-412 request was banned`。  
Vercel Edge Functions 使用 AWS CloudFront / Vercel 自有 IP,不在 B 站黑名单,稳定可用。

### Q: 模型清单多久更新一次?
A: `src/config/vendors.ts` 里按 TRAE 文档([docs.trae.cn/ide/models](https://docs.trae.cn/ide/models))对齐,TR有新模型时改一行即可。

---

## 路线图(未实现)

- [ ] 导出解读为 Markdown / PDF
- [ ] YouTube / 抖音支持
- [ ] 多视频对比
- [ ] 云端历史同步(可选)

---

## 贡献指南

1. **新增厂商**:在 `src/config/vendors.ts` 的 `VENDORS` 数组加一项即可,系统会自动:
   - 在设置面板的「厂商」下拉里出现
   - 模型输入框里输入对应模型时自动匹配
2. **新增模型**:在对应厂商的 `models` 数组里加 `{ id, label, hint? }`
3. **新增组件**:放在 `src/components/`,原子组件放 `src/components/ui/`
4. **修改 Prompt**:改 `src/prompts/interpreter.ts`,输出 JSON 结构不变即可

---

## 许可证

MIT