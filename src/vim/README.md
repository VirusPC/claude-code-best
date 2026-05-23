# `src/vim` — Vim 编辑模式

在 CLI 输入框中实现完整的 Vim 编辑模式，采用显式状态机架构。

## 主要文件

| 文件 | 职责 |
|------|------|
| `types.ts` | **状态机完整类型定义**（200 行）：含状态图注释、`VimState`、`CommandState`、`PersistentState`（lastChange/lastFind/register 用于 dot-repeat）及工厂函数；类型即文档 |
| `transitions.ts` | 状态转换驱动器，处理键盘输入并更新状态机 |
| `motions.ts` | 光标移动：`h`/`j`/`k`/`l`/`w`/`b`/`e`/`$`/`^`/`0` 等 |
| `operators.ts` | 操作符：`d`/`c`/`y` + motion |
| `textObjects.ts` | 文本对象：`iw`/`aw`、引号对、括号对等 |

## 状态机

两大模式：`INSERT` / `NORMAL`

NORMAL 子状态：`idle` / `count` / `operator` / `find` / `g` / `replace` / `indent`

## 支持特性

- Dot-repeat（`.` 命令重复）
- 寄存器（yank/paste）
- 计数前缀（`3w`、`2dd` 等）

## 依赖关系

- 独立的纯逻辑模块，无外部项目依赖（纯计算代码）
- 被 `PromptInput` 等文本输入 UI 组件集成，通过键盘事件驱动
