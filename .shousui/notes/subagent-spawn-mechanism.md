# Subagent 是如何被 spawn 出来的

> 追踪 `Agent` 工具从模型 tool_use 到子 ReAct loop 起来的完整链路。所有代码集中在 `packages/builtin-tools/src/tools/AgentTool/`。

## TL;DR

Subagent = 一份新的 `AgentDefinition`（system prompt + 白名单工具 + model）+ 一个派生的 `toolUseContext`，进入 `runAgent()` 里再跑一遍 `query()` ReAct loop。顶层 `AgentTool.call()` 只是路由（fork / teammate / 普通 / 前后台），把子 loop 的消息 yield 回父 loop 作为该 tool 的输出。

## 调用链

```
父 query() 循环
  ↓ 模型输出 tool_use { name: "Agent", input: {...} }
AgentTool.call()                              ← AgentTool.tsx:322
  ├─ 判断模式：teammate / fork / 普通
  ├─ 选出 AgentDefinition
  ├─ 组装 runAgentParams
  └─ 分派：
     ├─ async  → runAsyncAgentLifecycle({ makeStream: p => runAgent(...) })
     └─ sync   → for await (const msg of runAgent(runAgentParams))
                                              ↓
runAgent()  (async generator)                ← runAgent.ts:257
  ├─ 解析 model / MCP / hooks / Langfuse subtrace
  ├─ createSubagentContext() 派生 agentToolUseContext
  ├─ 写 agent metadata / sidechain transcript
  └─ for await (const message of query({ ... }))   ← runAgent.ts:776
        （真正的子 ReAct loop，复用 src/query.ts）
```

## 关键代码位置

### 1. 入口分派：`AgentTool.call()`
`packages/builtin-tools/src/tools/AgentTool/AgentTool.tsx:322`

按顺序判断走哪条路：

| 分支 | 触发条件 | 代码位置 | 说明 |
|------|----------|----------|------|
| **Teammate** | `team_name + name` | `AgentTool.tsx:375-408` | 调用 `spawnTeammate()`（`shared/spawnMultiAgent.ts`），在 in-process 或 tmux/iterm/windows-terminal 后端拉起团队成员 |
| **Fork** | `subagent_type` 省略 + `FORK_SUBAGENT` feature 开 | `AgentTool.tsx:414-431` | 选 `FORK_AGENT`，继承父 conversation、父工具、父 system prompt（缓存命中优化，`forkSubagent.ts`） |
| **普通 subagent** | 其余情况 | `AgentTool.tsx:432+` | 从 `toolUseContext.options.agentDefinitions.activeAgents` 里按 `allowedAgentTypes` / denied 过滤后选出 `AgentDefinition` |

前置约束（`AgentTool.tsx:351-371`）：
- Teammate 不能再 spawn teammate（roster 是扁平的）
- In-process teammate 不能 spawn 后台 agent（生命周期绑主进程）
- Fork 子内部不能再 fork（`querySource === 'agent:builtin:fork'` 或消息扫描检测）

### 2. 组装 runAgentParams
`AgentTool.tsx:756-789`

打包：
- `agentDefinition / promptMessages / toolUseContext / canUseTool`
- `availableTools` = fork 走 `filterParentToolsForFork(parent tools)`，普通走重建的 `workerTools`
- `override.systemPrompt` = fork 走父 system prompt；普通走 `enhancedSystemPrompt`（无 cwd 覆盖时）
- `worktreePath / description / querySource / model`
- Fork 专用：`forkContextMessages = parent messages`, `useExactTools: true`

### 3. 同步 / 异步分派

**异步（`run_in_background=true`）** `AgentTool.tsx:829-912`

```
registerAsyncAgent()                    // 注册后台任务
  ↓
runWithAgentContext(ctx, () =>
  wrapWithCwd(() =>
    runAsyncAgentLifecycle({
      makeStream: p => runAgent({
        ...runAgentParams,
        override: { ..., agentId, abortController },
        onCacheSafeParams: p,
      }),
      ...
    })
  )
)
  ↓
立即返回 { status: 'async_launched', agentId, outputFile }
```

**同步** `AgentTool.tsx:913+`

```
runWithAgentContext(ctx, () =>
  wrapWithCwd(async () => {
    ...
    for await (const msg of runAgent(runAgentParams)) {
      onProgress(msg)              // 边跑边推给父 UI
      ...                           // 支持前台/后台切换、autoBackground
    }
  })
)
```

### 4. 核心 async generator：`runAgent()`
`packages/builtin-tools/src/tools/AgentTool/runAgent.ts:257`

真正启动子 agent 的 ReAct loop：

1. **准备**：解析 model、MCP 服务器、frontmatter hooks、Langfuse subtrace
2. **派生 context**：`createSubagentContext()`（`src/utils/forkedAgent.ts`）拿到独立的 `agentToolUseContext`，clone 文件缓存、abort controller、setAppState 桥
3. **持久化**：写 `agentMetadata`，登记 sidechain transcript 目录
4. **进入子 loop**：`runAgent.ts:776`
   ```ts
   for await (const message of query({
     messages: initialMessages,
     systemPrompt: agentSystemPrompt,
     userContext, systemContext,
     canUseTool,
     toolUseContext: agentToolUseContext,
     querySource,
     maxTurns: maxTurns ?? agentDefinition.maxTurns,
   })) {
     // 处理 stream / attachment / max_turns_reached
     yield message
   }
   ```

## 与 ReAct 三层壳的对应

对照 `.shousui/notes/query-react-three-layers.md` 的三层模型：

- **父 REPL** 的 QueryEngine → `query()` → tool_use(`Agent`)
- **AgentTool.call()** 是路由 + 生命周期壳
- **runAgent()** 是新的一层「壳」：套系统提示、套工具白名单、套 subtrace，然后 recurse 到同一个 `query()` 上
- 子 `query()` 里如果再遇到 `Agent` tool_use，就再叠一层（fork 分支特意加了递归守卫防止无限套娃）

消息通过 `yield` 冒泡回父 `query()`，作为 `Agent` 这个 tool_use 的 tool_result / progress。

## 三种 subagent 形态的差异

| 维度 | 普通 subagent | Fork | Teammate |
|------|---------------|------|----------|
| System prompt | agent 定义里的 prompt | 父 system prompt | agent 定义 |
| 工具集 | 按 agent 定义重建 | 父工具原样 | 按 agent 定义 |
| 对话上下文 | 干净 | 继承父 messages | 干净 |
| 缓存命中 | 一般 | 优化过（工具/prompt 完全一致） | 一般 |
| 进程 | 同进程 | 同进程 | in-process / tmux / iterm 等 |
| 用途 | 常规子任务 | 复杂上下文延续 | 多智能体并行/协作 |

## 相关文件速查

```
packages/builtin-tools/src/tools/AgentTool/
├── AgentTool.tsx           # 入口路由 + 前后台生命周期
├── runAgent.ts             # 核心 async generator，跑子 query()
├── forkSubagent.ts         # fork 分支的工具/context 过滤
├── resumeAgent.ts          # resume 已存在的 agent
├── loadAgentsDir.ts        # 从 .claude/agents 加载 AgentDefinition
├── builtInAgents.ts        # 内置 general-purpose / fork / 等
├── agentToolUtils.ts       # 通用工具函数
└── prompt.ts               # AgentTool 自己的 tool description

packages/builtin-tools/src/tools/shared/
└── spawnMultiAgent.ts      # spawnTeammate（多智能体入口）

src/utils/forkedAgent.ts    # createSubagentContext（派生 toolUseContext）
src/query.ts                # 子 loop 的实际实现
```

---

## AgentTool 的启用与触发时机

### 是否常驻工具？—— 是

`AgentTool` 的 tool 定义**没有覆写 `isEnabled`**，`src/Tool.ts:778` 的 `TOOL_DEFAULTS.isEnabled = () => true` 兜底 → 默认永远启用。

在 `src/tools.ts:217 getAllBaseTools()` 里，`AgentTool` 是列表首元素（`tools.ts:219`），无条件注册。因此任何模式下 LLM 都能在 tool schema 里看到 `Agent`（除非被用户 deny）。

**唯一会藏起 AgentTool 的路径**：`CLAUDE_CODE_SIMPLE=1` 简化模式（只留 Bash/Read/Edit）；但若同时开 `COORDINATOR_MODE` + `CLAUDE_CODE_COORDINATOR_MODE`，又会把 `AgentTool` 补回（`tools.ts:325`）。

### `call()` 何时触发

与其他工具完全一致：**LLM 在流式响应里输出 `tool_use { name: "Agent", ... }` 时**，父 `query()` loop 分派给 `AgentTool.call()`。主进程从不主动调，全部由模型决策。

模型会不会选它，取决于：
- Tool 的 `prompt()`（`AgentTool.tsx:307`）在描述里列出可用 `subagent_type`（`filteredAgents`）
- 用户 prompt 是否让模型判断「该委托子任务」

### 不开 agent teams 也会触发吗？—— 会

`isAgentSwarmsEnabled()` **只 gate teammate 分支**，不影响整个 AgentTool。全代码库只两处引用：

- `AgentTool.tsx:351` — `team_name && !isAgentSwarmsEnabled()` 时抛错
- `AgentTool.tsx:1606 resolveTeamName()` — 关闭时返回 `undefined`

关闭 teams 时：
- 普通 subagent 分支（`AgentTool.tsx:432+`）照常工作
- Fork 分支照常（受独立的 `FORK_SUBAGENT` feature 控制）
- 只有传 `team_name` 的调用被拒

### 关 teams 时可选的 subagent

`packages/builtin-tools/src/tools/AgentTool/builtInAgents.ts:20 getBuiltInAgents()`：

| Agent | 触发条件 |
|-------|----------|
| `general-purpose` | 永远有 |
| `statusline-setup` | 永远有 |
| `claude-code-guide` | 非 SDK 入口（`CLAUDE_CODE_ENTRYPOINT` ≠ sdk-*） |
| `Explore` / `Plan` | `BUILTIN_EXPLORE_PLAN_AGENTS` feature 开 |
| `Verification` | `VERIFICATION_AGENT` feature + growthbook 开 |
| Coordinator agents | `COORDINATOR_MODE` + env 开时**替换**上面的默认集 |
| 用户自定义 | `.claude/agents/*.md` |

例外：`CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1` + 非交互（SDK）模式 → `getBuiltInAgents()` 返回空数组，此时 AgentTool 仍然存在但只能用用户自定义 agent。

### 一句话结论

`AgentTool` **默认全程可用**，何时被调完全由 LLM 决定；`isAgentSwarmsEnabled()` 只控制多智能体 team 那条分支（`team_name + name`），不影响普通 subagent 和 fork。

