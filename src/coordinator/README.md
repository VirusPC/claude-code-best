# `src/coordinator` — 多 Agent 协调模式

实现多 Agent 协调模式（Coordinator Mode），允许 coordinator 作为"指挥官"通过 AgentTool 派发 worker 子代理。

Feature flag: `COORDINATOR_MODE`，环境变量: `CLAUDE_CODE_COORDINATOR_MODE`

## 主要文件

| 文件 | 职责 |
|------|------|
| `coordinatorMode.ts` | 导出 `isCoordinatorMode()`、`getCoordinatorSystemPrompt()`、`getCoordinatorUserContext()`；包含完整的 coordinator 系统提示词，定义并发调度、worker 续接、研究-实现-验证工作流 |
| `workerAgent.ts` | 定义 `WORKER_AGENT` 的 `BuiltInAgentDefinition`，导出 `getCoordinatorAgents()`，供 `getBuiltInAgents()` 在 coordinator 模式下调用 |

## 工作流模式

- Coordinator 并发派发多个 worker
- Worker 通过 SendMessageTool 续接任务
- 遵循 研究 → 实现 → 验证 的三阶段工作流

## 依赖关系

- 依赖：`builtin-tools`（AgentTool、SendMessageTool 等常量）、`constants/tools.js`（`ASYNC_AGENT_ALLOWED_TOOLS`）
- 被 QueryEngine 层在 coordinator 模式激活时调用
