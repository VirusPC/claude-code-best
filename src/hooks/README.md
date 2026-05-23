# `src/hooks` — UI 层 React Hooks

REPL 交互的全部行为逻辑 React Hooks 集合，约 80 个 hook 文件。

## 主要子目录

| 子目录 | 职责 |
|--------|------|
| `notifs/` | 通知相关 hooks |
| `toolPermission/` | 工具权限请求 hooks |

## 关键 Hooks

| Hook | 职责 |
|------|------|
| `useDeferredHookMessages.ts` | 管理 SessionStart hook 的异步注入，避免阻塞初次渲染（~500ms 延迟解决方案） |
| `useCommandKeybindings.tsx` | 整合键位绑定与命令响应 |
| `useGlobalKeybindings.tsx` | 顶层全局快捷键管理 |

## 其他工具文件

| 文件 | 职责 |
|------|------|
| `fileSuggestions.ts` | 文件路径补全建议 |
| `renderPlaceholder.ts` | 输入框占位渲染 |
| `unifiedSuggestions.ts` | 统一建议逻辑 |

## 覆盖功能

API key 验证、历史记录搜索、会话背景化、IDE 集成状态、剪贴板、语音输入、键盘绑定、task 列表监控、后台 agent 任务、Swarm 初始化、Pipe IPC 路由、权限转发、scroll 等

## 依赖关系

- 依赖：`types/message`、`services/analytics`、`bridge`、`keybindings`、`memdir`、各 builtin-tools
- 被 `REPL.tsx` 或顶层 UI 组件消费
