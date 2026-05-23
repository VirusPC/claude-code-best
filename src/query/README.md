# `src/query` — 查询循环支撑模块

封装 `query()` 主查询循环的支撑子模块，提供配置快照、依赖注入、token 预算、stop hooks 等核心支撑。

## 主要文件

| 文件 | 职责 |
|------|------|
| `config.ts` | `QueryConfig`：查询配置快照类型 |
| `deps.ts` | `QueryDeps`：依赖注入容器，便于单元测试 |
| `stopHooks.ts` | `handleStopHooks()`：Stop hook 执行流，含 TeammateIdle/TaskCompleted hooks；也处理自动记忆提取、auto-dream、computer use 清理等副作用 |
| `tokenBudget.ts` | `BudgetTracker`/`checkTokenBudget()`：token 预算跟踪与续行决策 |
| `transitions.ts` | 循环状态机的终止/续行原因类型（`Terminal`/`Continue`） |

## 说明

这些文件是 `src/query.ts`（主查询循环）的支撑子模块，主查询循环本身位于 `src/query.ts`（顶级）。

## 依赖关系

- 依赖：`services/api/claude`、`services/compact`、`utils/hooks`、`utils/messages`、`bootstrap/state`
- 为主查询循环提供子模块支撑
