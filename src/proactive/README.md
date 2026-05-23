# `src/proactive` — 主动自主代理模式

实现主动（Proactive）自主代理模式，驱动模型在用户空闲时持续自主工作。

Feature flag: `PROACTIVE` / `KAIROS`

## 主要文件

| 文件 | 职责 |
|------|------|
| `index.ts` | 状态机：导出 `activateProactive`、`deactivateProactive`、`pauseProactive`、`shouldTick`、`subscribeToProactiveChanges`；管理 inactive→active→paused 状态转换 |
| `useProactive.ts` | React hook：在 REPL 中每 30 秒注入一次 `<tick>HH:MM:SS</tick>` 提示，驱动模型自主执行 |

## 工作机制

1. 每 30 秒向队列注入时间戳 tick
2. 模型通过 `SleepTool` 自控唤醒节奏
3. 用户介入时自动暂停（paused 状态）

## 依赖关系

- 依赖：`utils/autonomyRuns`、`utils/autonomyQueueLifecycle`、`constants/xml`
- 被 `screens/REPL.tsx` 挂载使用
