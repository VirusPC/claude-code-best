# `src/schemas` — 共享 Schema 定义

存放从其他模块提取出来以打破循环依赖的共享 Zod schema 定义。

## 主要文件

| 文件 | 职责 |
|------|------|
| `hooks.ts` | Hook 相关的 Zod schema，原位于 `utils/settings/types.ts`，独立提取以打破循环依赖 |

## Hook Schema 类型

- `HookCommandSchema` — Shell 命令 hook
- `PromptHook` — 提示词 hook
- `AgentHook` — Agent hook
- `HttpHook` — HTTP hook
- `HookMatcherSchema` — Hook 匹配条件
- `HooksSchema` — 整体 hooks 配置

## 依赖关系

- 依赖：`entrypoints/agentSdkTypes`（HOOK_EVENTS）、`utils/lazySchema`、`utils/shell/shellProvider`、`zod`
- 被 `utils/settings/types.ts` 和 `plugins/schemas.ts` 共同引用，是消除循环依赖的中间层
