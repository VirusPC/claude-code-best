# `src/screens` — 顶层 UI 屏幕

顶层 React 屏幕（screen）组件层，包含三个主要 UI 入口。

## 主要文件

| 文件 | 职责 |
|------|------|
| `REPL.tsx` | **主交互循环**：处理用户输入、查询提交、消息展示、token 计数、快捷键等全功能 REPL 界面 |
| `Doctor.tsx` | `/doctor` 命令的诊断界面：展示安装状态、版本、MCP、插件错误、权限规则、上下文警告等 |
| `ResumeConversation.tsx` | 会话恢复选择界面 |

## REPL.tsx 说明

REPL 是整个 CLI 交互的核心 UI 容器，是依赖树顶端：
- 挂载所有 hooks（`hooks/` 目录）
- 渲染所有 UI 组件（`components/` 目录）
- 管理 QueryEngine 实例
- 处理全局键盘快捷键

## 依赖关系

- 依赖：`bootstrap/state`、`state/AppState`、`utils/doctorDiagnostic`、`utils/autoUpdater`、`components/`、`hooks/` 等大量模块
- 处于依赖树顶端，是用户可见 UI 层的最终组合点
