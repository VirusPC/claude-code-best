# `src/components` — TUI UI 组件

所有 Ink（React for CLI）UI 组件的实现，构成完整的交互式终端界面（TUI）。

## 关键组件

| 组件 | 职责 |
|------|------|
| `App.tsx` | 顶层 Provider 树，组合 FpsMetrics、Stats、AppState、Theme 等 Context Provider |
| `Messages.tsx` / `MessageRow.tsx` | 消息列表渲染（支持虚拟滚动） |
| `PromptInput/` | 用户输入框核心组件 |
| `StatusLine.tsx` | 底部状态栏 |
| `permissions/` | 工具权限审批 UI |
| `agents/` | Agent 状态指示器 |
| `mcp/` | MCP 服务器管理界面 |
| `memory/` | 记忆可视化组件 |
| `diff/` | Diff 展示组件 |
| `design-system/` | 复用 UI 组件（Dialog、FuzzyPicker、ProgressBar、ThemeProvider 等） |
| `Settings/` | 设置面板 |
| `hooks/` | 组件级 React hooks |

## 技术说明

- 运行于 Ink 框架（`packages/@ant/ink/`，非标准 `inkjs`）
- React Compiler output：组件含 `_c()` memoization 调用，属正常反编译产物
- 重度依赖 `context/`（所有 React Context）和 `state/AppState.ts`
- 被 `screens/REPL.tsx` 等顶层屏幕渲染
