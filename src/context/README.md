# `src/context` — React Context Providers

所有 React Context Provider 的集合，为 TUI 组件树提供共享运行时状态。

## 主要文件

| 文件 | 提供的 Context |
|------|--------------|
| `stats.tsx` | 内存中的指标存储（计数器/直方图/集合，支持 reservoir 采样，进程退出时持久化） |
| `mailbox.tsx` | 进程间消息传递的信箱 Context |
| `notifications.tsx` | 通知状态管理 |
| `modalContext.tsx` | 模态框层叠状态 |
| `overlayContext.tsx` | Overlay 层叠状态 |
| `promptOverlayContext.tsx` | 提示 Overlay 状态 |
| `QueuedMessageContext.tsx` | 队列消息 Context |
| `fpsMetrics.tsx` | 帧率指标传递 |
| `voice.tsx` | 语音输入 Context |

## 关键说明

`stats.tsx` 导出 `StatsProvider`、`createStatsStore`、`useStats`/`useCounter`/`useGauge`/`useTimer` 等 hooks，进程退出时将指标写入 ProjectConfig。

## 依赖关系

- 依赖：`utils/config.js`（stats 持久化）、`utils/mailbox.js`（底层实现）
- 被 `components/App.tsx` 顶层组合，供所有 UI 子组件通过 hooks 消费
