# 视频解读 · Bilibili + AI

> 输入 Bilibili 视频链接与关注点,AI 为你总结视频内容,并定位与关注点相关的时间段。

![技术栈](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel)

## 功能特性

- 🎬 **Bilibili 视频解读**:粘贴 BV 链接,自动获取视频元信息与字幕
- 🧠 **MiniMax M3 驱动**:支持自定义 Base URL 与模型,流式输出解读结果
- 📑 **结构化输出**:视频主要内容总结 + 与关注点相关的时间段片段(可一键跳转 B 站)
- 💬 **对话历史**:自动保存在本机浏览器(localStorage),最多 50 条
- 🔒 **隐私优先**:无后端、API Key 经 AES-256-GCM 加密、所有数据仅在本机
- 🌗 **暗色模式**:跟随系统或手动切换
- 📱 **响应式**:PC / 平板 / 移动端自适应

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Vite + React 18 + TypeScript |
| 样式 | Tailwind CSS + Radix UI |
| 状态 | Zustand |
| 字幕渲染 | react-markdown + remark-gfm + rehype-sanitize |
| 部署 | Vercel(Edge Functions + 静态托管) |
| AI | MiniMax M3 (OpenAI 兼容接口) |

## 项目结构

```
video_interpreting/
├── src/                      # React 前端
│   ├── components/           # UI 组件
│   ├── pages/HomePage.tsx    # 唯一页面
│   ├── services/             # 业务服务(AI、B站、本地存储)
│   ├── store/useAppStore.ts  # Zustand 全局状态
│   ├── prompts/              # AI Prompt 模板
│   ├── utils/                # 工具(URL 解析、加密)
│   └── types/                # 类型定义
├── api/                      # Vercel Edge Functions(B站代理)
│   ├── _utils/               # 工具函数(_ 前缀不会被识别为路由)
│   │   ├── cors.ts
│   │   └── wbi.ts
│   └── bili/
│       ├── aid.ts            # GET /api/bili/aid
│       └── subtitle.ts       # GET /api/bili/subtitle
├── server/                   # 本地开发用 Express 代理(可选)
│   └── dev-proxy.ts
├── public/                   # 静态资源
├── index.html                # HTML 入口
├── vite.config.ts
├── tailwind.config.js
└── vercel.json               # Vercel 配置
```

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动前端开发服务

```bash
npm run dev
```

访问 http://localhost:5173。

### 3. 启动 B站 API 代理(可选,用于联调字幕接口)

**方式 A:Express 代理**(无需 Vercel 账号)

另开一个终端:

```bash
npm run proxy:dev
```

代理服务会监听 `http://localhost:8799`,Vite 通过配置自动把 `/api/*` 转发到这里。

**方式 B:Vercel 本地模拟**(完整模拟线上环境,需要登录)

```bash
npm run vercel:dev
```

首次运行会提示登录 Vercel,然后启动 `vercel dev`,监听 `http://localhost:3000`。把 `vite.config.ts` 里的代理目标从 `8799` 改为 `3000` 即可使用此模式。

> 注:本项目默认代理端口为 **8799**。如果你本地的 8799 也被占用,可改 `vite.config.ts` 和 `server/dev-proxy.ts` 的 `PORT`。

### 4. 构建生产包

```bash
npm run build
```

产物输出到 `dist/` 目录。

## 部署到 Vercel

### 方式 A:Git 集成(推荐)

1. 把代码推送到 GitHub/GitLab。
2. 登录 [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project**。
3. 选你的 Git 仓库,点 **Import**。
4. Vercel 会自动识别为 Vite 项目,配置如下(一般无需改):
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. 点 **Deploy**。首次部署后,自动域名:`https://<project-name>.vercel.app`。

### 方式 B:Vercel CLI 直传

```bash
npm install -g vercel   # 或使用项目本地版本:npx vercel
vercel login            # 首次会打开浏览器授权
npm run deploy          # 等价于 vercel --prod
```

(若 `vercel` 提示 link 到已有项目或新建,选 Link to existing 或 Create new。)

## 配置 API Key

部署完成后,首次打开站点会弹出「安全声明」Modal,点击「我已知晓,继续」进入主界面。

点击右上角 **⚙ 设置** 按钮:
- **API Key**:必填,在 [MiniMax 控制台](https://api.minimaxi.com) 获取
- **API Base URL**:默认 `https://api.minimaxi.com/v1`(如使用代理或私有部署可改)
- **模型**:默认 `MiniMax-M3`
- **Temperature**:默认 0.4
- **启用分块 Map-Reduce**:长视频(>8 分钟)推荐开启,自动切片再合并
- **记住 API Key**:开启后加密保存到本机,下次自动填充

## 使用流程

1. 在主界面粘贴 Bilibili 视频链接(支持 BV 号自动识别)
2. 输入关注点(选填,留空则总结主要内容)
3. 点击「开始解读」
4. 等待 10 秒 ~ 数分钟(取决于视频长度与是否分块)
5. 查看结果:Summary + 时间线片段(点击时间跳转 B 站)
6. 完成的解读自动保存到「历史记录」

## 安全说明

- 所有用户数据仅保存在浏览器 localStorage,本应用 **不存储任何数据到服务器**
- API Key 经 PBKDF2 派生密钥 + AES-256-GCM 加密后存储(防止 DevTools 一眼看到明文、浏览器同步)
- Vercel Edge Functions **只代理 B站 字幕请求**,不会触及你的 API Key
- ⚠️ 此加密不能防同源 XSS 注入;请勿在不可信设备上使用

## 常见问题

### Q: 视频没有字幕怎么办?
A: 本应用只能解读带字幕的视频(人工或 AI 字幕均可)。如果 B站 该视频没有字幕,将提示「该视频暂无可用字幕」。

### Q: AI 解读超时或失败?
A: 检查 API Key 是否正确、Base URL 是否可访问、账户余额。可在设置中关闭「分块 Map-Reduce」尝试单块模式(适用于短视频)。

### Q: Vercel Edge Functions 部署失败?
A: 检查 `vercel.json` 中的 `outputDirectory` 是否正确(`dist`)。Functions 代码需放在 `/api` 目录下(已就位)。

### Q: 本地开发时 B站 API 报错?
A: B站 对未登录 + 无 SESSDATA 的请求有风控,可能返回 -352/-101 等错误码。Vercel Edge Functions IP 池相对干净,通常可正常访问。如仍失败,在「设置」填入 SESSDATA(你自己的 B站 Cookie)。

### Q: 为什么从 Cloudflare Pages 改到 Vercel?
A: Cloudflare Workers 的共享 IP 段被 B站 风控拉黑,导致在线环境下 B站 API 返回 `-412 request was banned`。Vercel Edge Functions 使用 AWS CloudFront / Vercel 自有 IP,不在 B站 黑名单中,稳定可用。

## 路线图(未实现)

- [ ] 导出解读结果为 Markdown / PDF
- [ ] YouTube / 抖音支持
- [ ] 多视频对比
- [ ] 云端历史同步(可选)

## 许可证

MIT