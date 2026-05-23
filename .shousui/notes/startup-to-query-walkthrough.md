# 从启动到 query()：源码阅读笔记

> 基于 `main.tsx` → REPL → `query()` 的代码走读整理。与官方白皮书 [`docs/introduction/architecture-overview.mdx`](../../docs/introduction/architecture-overview.mdx) 互补；该白皮书将 QueryEngine 写在 REPL 与 `query()` 之间，**当前实现中交互式 REPL 直接调用 `query()`**，QueryEngine 主要用于 `-p`/SDK/ACP。

相关专题文档：

- [System Prompt 组装与缓存](../../docs/context/system-prompt.mdx)
- [Agentic Loop](../../docs/conversation/the-loop.mdx)

---

## 1. 三层架构：CLI / Agent SDK / Anthropic SDK

| 层级 | 包/模块 | 作用 |
|------|---------|------|
| API 客户端 | `@anthropic-ai/sdk` | HTTP、Messages API 流式请求 |
| Agent 运行时 | `query()`、`QueryEngine`、工具/MCP/权限/压缩 | 本仓库核心 |
| 产品形态 | CLI（REPL）、`@anthropic-ai/claude-agent-sdk` | 终端产品 vs 可嵌入库 |

**关系（重要）：**

- **不是**「Claude Code 底层 = Agent SDK」。
- **是**「Agent SDK 基于 Claude Code 技术封装给程序用」；CLI 是源头实现。
- 交互式 REPL：**直接** `query()`；`-p` / Agent SDK / ACP：**`QueryEngine` → 内部仍调 `query()`**。

```
@anthropic-ai/sdk
       ↓
query()  ← 共用发动机
   ↙     ↘
REPL      QueryEngine（ask / ACP）
```

源码依据：`src/services/acp/agent.ts` 注释写明使用 internal QueryEngine，而非 `@anthropic-ai/claude-agent-sdk` 包。

---

## 2. CLI：`main.tsx` 与 Commander

### `run()` 做什么

- **不**读用户输入、**不**调 `query()`。
- 搭建 Commander、注册 `.option()` / `.command()` / `.action()`，末尾 `program.parseAsync(argv)`。
- `await run()` 会阻塞到 REPL 退出（`renderAndRun` → `root.waitUntilExit()`）。

入口：`src/main.tsx` 约 1057 行 `run()`，约 5481 行 `parseAsync`。

### 无 shell 参数为何走默认 `.action`

- 根命令 `program` 在约 1425 行挂了 `.action(async (prompt, options) => ...)`。
- 用户执行 `claude` 或 `claude "某段 prompt"` 时无子命令名，匹配根命令；`[prompt]` 为可选位置参数。
- `parseAsync` 解析 argv 后**自动**执行对应 action，无需手动调用。

### `.option()` vs `.addOption()`

| API | 含义 |
|-----|------|
| `.option()` | **声明** CLI 支持某个开关（语法糖） |
| `.addOption(new Option(...))` | 注册完整 `Option`（`.hideHelp()`、`.choices()`、`.argParser()` 等） |

均**不是**：给用户一份可选列表，也**不是**在此处写入运行时参数值；值来自 argv 或 `.default()`。

### Shell 子命令 vs Slash command

| | Shell 子命令 | Slash command |
|--|--------------|---------------|
| 注册 | `main.tsx` + Commander | `src/commands/<name>/` |
| 示例 | `claude mcp serve`（约 4647 行） | REPL 内 `/mcp`（`src/commands/mcp/index.ts`） |
| 时机 | 进程启动、`parseAsync` | 已在 REPL 内 |

---

## 3. 用户输入 → `query()` 全链路（默认 REPL）

```
main() → run() → parseAsync
  → 默认 .action (main.tsx ~1425)
  → launchRepl (replLauncher.tsx)
  → <REPL /> (screens/REPL.tsx)
  → PromptInput / handlePromptSubmit
  → onQuery → onQueryImpl
  → buildEffectiveSystemPrompt + getSystemPrompt / getUserContext / getSystemContext
  → query({ systemPrompt, userContext, systemContext, ... })  (query.ts)
```

---

## 4. `query()` vs `QueryEngine`

| | `query()` | `QueryEngine` |
|--|-----------|---------------|
| 角色 | 单轮 agent 循环（API、工具、压缩、多轮直至结束） | 会话外壳 + SDK 消息转换 |
| REPL | ✅ 直接调用 | ❌ 不用 |
| `-p` / SDK / ACP | 被内部调用 | ✅ `submitMessage` → `query()` |

`QueryEngine.ts` 注释：从 `ask()` 抽出，供 headless/SDK 使用，**未来可能**用于 REPL（当前未迁）。

**记法**：`query()` = 发动机；`QueryEngine` = 带会话状态与 `SDKMessage` 的外壳。

---

## 5. 三种 Context / Prompt

### 组装顺序（`query()` 内）

```
systemPrompt  ← buildEffectiveSystemPrompt(getSystemPrompt + agent/custom/append)
systemContext ← getSystemContext()（主要是 git）
userContext   ← getUserContext()（CLAUDE.md、日期）

fullSystemPrompt = appendSystemContext(systemPrompt, systemContext)
messages         = prependUserContext(messages, userContext)
→ callModel({ systemPrompt: fullSystemPrompt, messages })
```

| 参数 | 来源 | 进 API 方式 |
|------|------|-------------|
| **systemPrompt** | `getSystemPrompt()` + `buildEffectiveSystemPrompt()` | system 主体 |
| **systemContext** | `getSystemContext()`（`context.ts`） | **追加在 system 末尾**（`appendSystemContext`） |
| **userContext** | `getUserContext()` | **插到 messages 前**（`prependUserContext`，含 CLAUDE.md） |

---

## 6. Prompt caching

### 分界标记

```ts
// src/constants/prompts.ts
SYSTEM_PROMPT_DYNAMIC_BOUNDARY = '__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__'
```

- 插入在 `getSystemPrompt()` 返回数组的**静态段之后、动态段之前**（`shouldUseGlobalCacheScope()` 为真时）。
- `splitSysPromptPrefix()`（`src/utils/api.ts`）按该标记分块：前段 `cacheScope: 'global'`，后段不 global 缓存。
- **不发送给模型**；发 API 前跳过该数组项。
- 实际缓存靠 `buildSystemPromptBlocks()` 为各 text block 附加 `cache_control`（`src/services/api/claude.ts`）。

详见 [System Prompt 动态组装](../../docs/context/system-prompt.mdx)。

### 其它

- 段与段拼接常用 `'\n\n'`（普通分隔，非 cache 专用 magic string）。
- 对话历史可在最后一个 message block 上附加 `cache_control`。
- `systemContext`（git）拼在 system **尾部**，属动态部分。

---

## 7. `buildEffectiveSystemPrompt`（Effective = 最终生效）

多种 system 来源按优先级合并为**本轮实际使用的 system**（`src/utils/systemPrompt.ts`）：

```
0. overrideSystemPrompt     → 全替换
1. Coordinator 模式
2. mainThreadAgentDefinition → 一般替换 default；proactive 下 append 到 default
3. customSystemPrompt       → --system-prompt
4. defaultSystemPrompt      → getSystemPrompt()
+ appendSystemPrompt        → 末尾追加（override 时除外）
```

无单独类型名 `effectiveSystemPrompt`；局部变量常命名为 `systemPrompt`。

REPL 正常发消息（`REPL.tsx` ~3389）与 partial compact（~6446）均会先 `getSystemPrompt` 再 `buildEffectiveSystemPrompt`，保证与当前会话配置一致。

---

## 8. 速查表

| 你想找… | 去看… |
|---------|--------|
| CLI 入口 | `src/entrypoints/cli.tsx` → `main.tsx` `run()` |
| 默认启动 REPL | `main.tsx` ~1425 `.action` → `launchRepl` |
| 终端输入 | `REPL.tsx` + `PromptInput` |
| 调模型循环 | `query.ts` → `query()` |
| 无头 / SDK | `cli/print.ts` → `QueryEngine.ask()` |
| 默认 system 内容 | `constants/prompts.ts` → `getSystemPrompt()` |
| 合并 agent/CLI 覆盖 | `utils/systemPrompt.ts` → `buildEffectiveSystemPrompt()` |
| 缓存分界 | `SYSTEM_PROMPT_DYNAMIC_BOUNDARY` + `utils/api.ts` `splitSysPromptPrefix` |
| Slash 命令 | `src/commands/` |
| Shell 子命令 | `main.tsx` 各 `program.command(...)` |

---

## 修订说明

- 若 REPL 未来迁入 `QueryEngine`，请同步更新本文第 1、4 节与 `docs/introduction/architecture-overview.mdx`。
