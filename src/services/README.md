# `src/services` — 后端服务层

全项目最大的服务层，聚合所有后端功能模块，是核心基础设施层。

## 主要子目录

| 子目录 | 职责 |
|--------|------|
| `api/` | API 客户端（claude、bedrock、vertex、gemini、grok、openai 6 个 provider） |
| `mcp/` | MCP 服务器连接生命周期管理 |
| `oauth/` | OAuth 认证流程 |
| `auth/` | 认证服务 |
| `analytics/` | 分析/埋点（GrowthBook、DataDog） |
| `compact/` | 上下文压缩服务 |
| `extractMemories/` | 自动记忆提取 |
| `lsp/` | LSP 语言服务器管理 |
| `MagicDocs/` | Magic Docs 自动更新 |
| `plugins/` | 插件管理服务 |
| `SessionMemory/` | 会话记忆 |
| `sessionTranscript/` | 会话记录 |
| `skillSearch/` | 技能搜索（TF-IDF + 语义） |
| `searchExtraTools/` | 延迟工具发现与搜索 |
| `tools/` | 工具执行编排（`StreamingToolExecutor`、`toolOrchestration`） |
| `langfuse/` | Langfuse 追踪集成 |
| `localVault/` | 本地密钥管理 |
| `acp/` | ACP 协议实现 |
| `AgentSummary/` | Agent 摘要生成 |
| `autoDream/` | Auto-dream 功能 |

## 关键独立文件

| 文件 | 职责 |
|------|------|
| `voice.ts` | 跨平台音频录制（原生 NAPI、SoX、ALSA fallback），懒加载 |
| `voiceStreamSTT.ts` | 语音流式 STT |
| `doubaoSTT.ts` | 豆包 STT 集成 |
| `tokenEstimation.ts` | Token 数量估算 |
| `langfuse/` | Langfuse 追踪 |
| `internalLogging.ts` | 内部日志 |
| `notifier.ts` | 系统通知 |

## 依赖关系

- 被 `state/`（MCP 工具注册）、`tasks/`（工具执行）、`skills/`（MCP skills 发现）广泛依赖
- 自身依赖 `utils/` 的 auth、debug、log、settings 等基础工具
