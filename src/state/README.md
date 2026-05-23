# `src/state` — 全局应用状态管理

采用自定义发布-订阅 Store 模式的全局 UI 状态管理层。

## 主要文件

| 文件 | 职责 |
|------|------|
| `AppStateStore.ts` | **全局状态类型中心**（575 行）：定义 `AppState` 类型（tasks、MCP、plugins、bridge、voice、computer-use、ultraplan 等所有子状态）及 `getDefaultAppState()` |
| `store.ts` | 通用响应式 Store 实现（34 行）：`createStore<T>` 支持 `getState`/`setState`/`subscribe` |
| `AppState.tsx` | React 层桥接：`AppStateProvider`、`AppStoreContext`，集成 VoiceProvider、SettingsChange 等副作用 |
| `selectors.ts` | 状态选择器（`useAppState` hook 和各字段 selector） |
| `onChangeAppState.ts` | 状态变更响应处理 |
| `teammateViewHelpers.ts` | Teammate 视图相关辅助函数 |

## 架构说明

- **非 Redux/Zustand**，是轻量级自定义发布-订阅模式
- `AppState` 包含数百个字段，涵盖所有 UI 运行时状态
- 与 `bootstrap/state.ts` 分工：`bootstrap/state.ts` 是进程级单例（非 React），`AppState` 是 React 组件树的状态

## 依赖关系

- 被全项目几乎所有 React 组件和 hook 依赖（通过 `useAppState` selector）
- 依赖：`tasks/types`、`services/mcp/types`、`types/message`、`utils/permissions`、`utils/settings` 等
