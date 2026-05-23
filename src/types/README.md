# `src/types` — 共享 TypeScript 类型定义

全项目共享类型定义的集中地，不含业务逻辑。

## 主要文件

| 文件 | 内容 |
|------|------|
| `message.ts` | 消息类型枢纽：从 `@ant/model-provider` re-export 核心类型，并定义 UI 层独有的 `RenderableMessage`、`CollapsedReadSearchGroup` |
| `command.ts` | 命令/技能类型 |
| `permissions.ts` | 权限模式和结果类型 |
| `tools.ts` | 工具类型（自动生成存根） |
| `ids.ts` | 类型安全的 ID 类型（`AgentId` 等 tagged ID） |
| `plugin.ts` | 插件类型定义 |
| `hooks.ts` | Hook 事件类型 |
| `logs.ts` | 日志类型 |
| `notebook.ts` | Notebook 类型 |
| `statusLine.ts` | 状态栏类型 |
| `textInputTypes.ts` | 文本输入类型 |
| `messageQueueTypes.ts` | 消息队列类型 |
| `connectorText.ts` | Connector text 类型 |
| `fileSuggestion.ts` | 文件建议类型 |
| `utils.ts` | 工具类型（TS utility types） |

## 类型声明文件（.d.ts）

| 文件 | 声明内容 |
|------|---------|
| `global.d.ts` | `MACRO`、`BUILD_TARGET`、`BUILD_ENV` 及内部 Anthropic 标识符 |
| `internal-modules.d.ts` | `bun:bundle`、`bun:ffi`、`@anthropic-ai/mcpb` 模块类型 |
| `ink-elements.d.ts` | Ink 元素类型 |
| `ink-jsx.d.ts` | Ink JSX 类型 |
| `react-compiler-runtime.d.ts` | React Compiler 运行时类型 |
| `sdk-stubs.d.ts` | SDK stub 类型 |

## 依赖关系

- 被全项目引用
- 自身仅依赖 `@ant/model-provider`、`@claude-code-best/builtin-tools` 等外部包，是真正的类型叶节点
