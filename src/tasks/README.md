# `src/tasks` — 后台任务系统

定义并实现所有可在后台运行的任务类型，每种任务封装特定执行模型。

## 任务类型

| 目录/文件 | 任务类型 | 说明 |
|-----------|---------|------|
| `LocalAgentTask/` | 本地子代理 | Agent tool 派发的本地代理任务 |
| `RemoteAgentTask/` | 远程代理 | CCR 远程代理任务 |
| `InProcessTeammateTask/` | 同进程 Teammate | 在同一进程内运行的 teammate |
| `LocalShellTask/` | Shell 命令 | Shell 命令任务 |
| `LocalWorkflowTask/` | SDK Workflow | SDK workflow 任务 |
| `MonitorMcpTask/` | MCP 监控 | MCP 服务器监控任务 |
| `DreamTask/` | Auto-dream | autoDream 功能任务 |
| `LocalMainSessionTask.ts` | 主会话后台化 | Ctrl+B 将主会话推入后台 |

## 主要文件

| 文件 | 职责 |
|------|------|
| `types.ts` | `TaskState` 联合类型与 `isBackgroundTask` 谓词，是 `state/AppStateStore.ts` 中 `tasks` 字段的类型来源 |
| `stopTask.ts` | 任务停止逻辑 |
| `pillLabel.ts` | 任务状态标签渲染 |

## 依赖关系

- 依赖：`query.ts`（实际 LLM 查询）、`utils/task/framework`（任务注册/状态更新）、`services/analytics`
- 被 `state/AppStateStore` 引用（tasks 字段），被各 UI 组件读取任务状态
