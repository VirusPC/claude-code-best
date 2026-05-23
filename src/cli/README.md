# `src/cli` — CLI 运行时核心基础设施

CLI 运行时的核心支撑层，提供后台任务引擎、网络传输、I/O 和更新等基础能力。

## 子目录

| 子目录 | 职责 |
|--------|------|
| `bg/` | 后台任务引擎（`engine.ts`、`engines/`、`tail.ts`） |
| `handlers/` | 请求处理器（agent、auth、auto-mode、autonomy、MCP、plugins 等特殊处理逻辑） |
| `transports/` | 网络传输层（WebSocket、SSE、Hybrid，用于与 CCR 后端通信） |

## 主要文件

| 文件 | 职责 |
|------|------|
| `bg.ts` | 后台任务入口 |
| `exit.ts` | Session 退出逻辑 |
| `print.ts` | 输出格式化 |
| `remoteIO.ts` | 远程 I/O 处理 |
| `rollback.ts` | 操作回滚 |
| `structuredIO.ts` | 结构化/非结构化 I/O |
| `up.ts` | `claude up`（从 CLAUDE.md 提取并执行 `# claude up` 脚本段） |
| `updateCCB.ts` | CLI 自动更新逻辑 |

## 依赖关系

- 依赖：`bootstrap/state.ts`、`bridge/`、`utils/git.js`
- 被调用：`entrypoints/`（主入口）和各命令处理链
