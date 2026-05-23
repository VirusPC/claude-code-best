# `src/memdir` — 持久化记忆系统

管理以 Markdown 文件为单元的持久化记忆存储（Memory Directory），并将记忆注入系统提示词。

## 存储路径

`~/.claude/projects/<slug>/memory/`（个人）  
`~/.claude/projects/<slug>/team-memory/`（团队，TEAMMEM feature）

## 主要文件

| 文件 | 职责 |
|------|------|
| `memdir.ts` | 核心入口：`loadMemoryPrompt()`、`buildMemoryLines()`/`buildMemoryPrompt()`、`truncateEntrypointContent()`、`ensureMemoryDirExists()`，以及 KAIROS 日志模式和 TEAMMEM 分支 |
| `findRelevantMemories.ts` | 扫描 memory 文件头并用 Sonnet 做语义选择，返回最多 5 个相关记忆文件路径+mtime |
| `memoryScan.ts` | 扫描记忆文件元数据 |
| `memoryAge.ts` | 记忆文件时效管理 |
| `memoryTypes.ts` | 记忆类型定义 |
| `memoryShapeTelemetry.ts` | 记忆使用遥测上报 |
| `paths.ts` | 个人记忆路径计算 |
| `teamMemPaths.ts` | 团队记忆路径计算 |
| `teamMemPrompts.ts` | 团队记忆提示词构建 |

## 限制

- `MEMORY.md` 行数上限：200 行（超出附截断告警）
- 单文件大小上限：25KB

## 依赖关系

- 依赖：`services/analytics`、`utils/sideQuery`（Sonnet 调用）、`bootstrap/state`、`utils/settings/settings`
- 被调用：系统提示构建流程（`claudemd.ts`/`QueryEngine.ts`）以及 hooks 层
