# Changelog

所有显著改动都记录在此文件。版本号遵循 [SemVer](https://semver.org/lang/zh-CN/),日期格式 `YYYY-MM-DD`。

## [Unreleased]

### Added
- **多厂商 AI 支持**(DeepSeek / Doubao / GLM / Kimi / MiniMax),模型清单对齐 TRAE 预置模型
- **模糊模型匹配**:`DeepSeek-V4-Pro` / `DeepSeek V4 Pro` / `deepseek_v4_pro` 都能自动识别为同一模型,自动填充厂商 / Base URL / 端点路径
- **模型 ID 规范化**:DeepSeek API 严格要求小写,系统自动把用户输入的 `DeepSeek-V4-Pro` 转成 `deepseek-v4-pro` 再发请求(避免 400)
- **解读后追问 Q&A 面板**:基于「字幕全文 + 关注点 + summary」的流式问答,可中断、可清空
- **设置面板「厂商」下拉** + 模型输入框旁「申请 Key」直跳各家控制台
- **DeepSeek thinking 自动关闭**:在请求体里注入 `thinking: { type: 'disabled' }`,避免 V4 默认高推理深度导致超时

### Changed
- `src/services/ai.ts` 重构:删除硬编码的 MiniMax 流式函数,统一走 `buildChatUrl(baseUrl, chatPath)`,每个请求都按厂商附 `extraBody`
- `src/store/useAppStore.ts` `init()` 迁移逻辑加强:启动时强制覆盖与 model 不一致的 `vendor` / `baseUrl` / `chatPath`,并规范化 `model` 字段
- `src/store/useAppStore.ts` `updateSettings()`:用户改模型输入时实时同步 vendor / baseUrl / chatPath

### Fixed
- 修复「DeepSeek 模型走 MiniMax 端点」的 404 / 401(因旧迁移逻辑没覆盖 `chatPath`)
- 修复「DeepSeek V4 thinking 模式卡死」的 90s+ 无响应
- 修复「DeepSeek API 大小写敏感」的 400 (`The supported API model names are deepseek-v4-pro`)

## [0.1.0] - 2025-09

### Added
- 初始版本:Bilibili 视频解读 + MiniMax M3 + Vercel Edge Functions 代理

[Unreleased]: https://github.com/<user>/video_interpreting/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/<user>/video_interpreting/releases/tag/v0.1.0