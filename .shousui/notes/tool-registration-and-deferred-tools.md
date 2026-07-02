# 工具注册与延迟加载（deferred tools）机制

> 为什么 `getAllBaseTools()` 里挂着一大堆看似「用不到」的工具？比如 agent teams 默认关闭还带着 `TeamCreateTool`？回答：**工具注册 ≠ 模型可见 ≠ 允许调用**，这三件事由三套独立机制决定。

## TL;DR

| 层次 | 由谁决定 | 关闭时的效果 |
|------|----------|--------------|
| 1. 工具存在 | `getAllBaseTools()` + `Tool.isEnabled()` | 工具压根不在注册表 |
| 2. 初始 schema 可见 | `CORE_TOOLS` 白名单 + `shouldDefer` → `isDeferredTool()` | 不进入初始 prompt，靠 `SearchExtraTools` 发现 |
| 3. runtime 允许调用 | 工具自己 `call()` 里的业务判断（如 `isAgentSwarmsEnabled()`） | 抛错拒绝执行 |

`getAllBaseTools()` 是**穷举全集**（source of truth for existence），跟模型「看到什么」「能调什么」是解耦的。

## 三层机制详解

### 第 1 层：`isEnabled()` —— 工具是否存在

`src/tools.ts:203 getToolsForDefaultPreset()` 遍历 `getAllBaseTools()` 后按 `tool.isEnabled()` 过滤。

- `src/Tool.ts:778 TOOL_DEFAULTS.isEnabled = () => true` — 未覆写时永远启用
- 覆写例子：`PushNotificationTool`、`CronCreateTool`、`TeamDeleteTool` 等按 env/feature 判断
- 所以能否出现在「预设工具列表」由 `isEnabled()` 决定

### 第 2 层：`CORE_TOOLS` 白名单 + `shouldDefer` —— 是否放进初始 tool schema

即使工具启用，未必立刻塞给模型。`src/constants/tools.ts:137 CORE_TOOLS` 明确列出 **~25 个「初始加载」核心工具**（Bash / Read / Edit / Agent / TaskCreate / SearchExtraTools / ExecuteExtraTool 等）。判定函数 `isDeferredTool()`（在 `packages/builtin-tools/src/tools/ToolSearchTool/prompt.ts`）为白名单制：

```
if (tool.alwaysLoad) return false                // 强制常驻
if (CORE_TOOLS.has(tool.name)) return false      // 白名单命中
return true                                       // 其他一律 deferred
```

所有非白名单工具（含 TeamCreate/TeamDelete、大部分 MCP 工具、Workflow、Monitor…）都是 **deferred**：

- 初始 tool schema 里**不给模型**，节省 token
- 模型通过 `SearchExtraTools`（TF-IDF 检索）用关键词搜索
- 命中后调 `ExecuteExtraTool` 间接调用

工具的 `searchHint` 字段就是这个 TF-IDF 索引的语料，比如：
```ts
// TeamCreateTool.ts:76-77
searchHint: 'create multi-agent swarm team, collaborate, parallel agents, task distribution, agent coordination, team management'
```

`shouldDefer: true` 只是显式声明（`TeamCreateTool.ts:79`），实际决定仍走 `CORE_TOOLS` 白名单。

### 第 3 层：`call()` runtime 守卫 —— 是否允许执行

即便 defer 也可能被绕过（用户显式 allow、SearchExtraTools 检索出后模型硬调），工具在 `call()` 里做最终检查：

```ts
// TeamCreateTool.ts:130-134
async call(input, context) {
  if (!isAgentSwarmsEnabled()) {
    throw new Error('Agent Teams 功能未启用...')
  }
  ...
}
```

同样的模式：`AgentTool.tsx:351` 检查 teammate 分支、fork 分支的递归守卫、`call()` 里各种 feature 检查。

## 案例：TeamCreateTool 的完整路径

| 状态 | Env | `isEnabled()` | 在 `getAllBaseTools()` | 初始 schema 可见 | `call()` 允许 |
|------|-----|---------------|------------------------|----------------|---------------|
| 默认 | 无 | true | ✅ | ❌ deferred | ✅ |
| 显式关闭 | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS_DISABLED=1` | true* | ✅ | ❌ deferred | ❌ 抛错 |

\* `TeamCreateTool.isEnabled()` 硬编码 `return true`（`TeamCreateTool.ts:89-91`），不看 swarm 开关；关闭 teams 后工具**仍在注册表里**，但走不到执行。

关键代码位置：
- 定义：`packages/builtin-tools/src/tools/TeamCreateTool/TeamCreateTool.ts`
- 注册：`src/tools.ts:254 getTeamCreateTool()`（懒加载破循环依赖）
- 白名单：`src/constants/tools.ts:137 CORE_TOOLS`（不包含 TEAM_CREATE）
- 默认策略：`src/utils/agentSwarmsEnabled.ts:11-17`（默认 true）

## 案例：AgentTool 的对照

对比 `AgentTool`：

- `isEnabled()` 未覆写 → 默认 true
- `AGENT_TOOL_NAME` 在 `CORE_TOOLS` 白名单里（`tools.ts:147`）→ **不 defer，初始 schema 就有**
- `call()` 里只在 teammate 分支检查 `isAgentSwarmsEnabled()`，普通/fork subagent 分支无条件通过

所以 AgentTool 是「一等公民」，TeamCreate 是「按需发现」——虽然两者都在 `getAllBaseTools()` 里且默认 enabled。

## 为什么这么设计

1. **Token 成本** —— tool schema 每个工具都要 few hundred tokens；穷举塞给模型会浪费大量 context。核心工具直接给，长尾工具做懒发现。
2. **模型选择噪声** —— 工具越多，模型越容易选错。核心工具集稳定后模型行为更可预测。
3. **注册表 = 类型系统的锚点** —— `getAllBaseTools()` 是 tool name → Tool 实例的映射，permission 系统、agent 工具白名单、`filterToolsByDenyRules` 等都需要「所有可能存在的工具」这一集合。
4. **懒加载破循环** —— `TeamCreateTool` 通过 `src/tools.ts:70 getTeamCreateTool = () => require(...)` 懒加载，避免 tools.ts → TeamCreateTool → ... → tools.ts 的循环依赖。

## 相关文件速查

```
src/tools.ts                                    # getAllBaseTools() / getTools() 主入口
src/Tool.ts                                     # Tool 接口 + TOOL_DEFAULTS（isEnabled 默认 true）
src/constants/tools.ts                          # CORE_TOOLS 白名单 + ALL_AGENT_DISALLOWED_TOOLS
src/utils/agentSwarmsEnabled.ts                 # 默认开启，disabled env 关闭
packages/builtin-tools/src/tools/ToolSearchTool/prompt.ts    # isDeferredTool() 白名单制
packages/builtin-tools/src/tools/SearchExtraToolsTool/       # TF-IDF 检索层
packages/builtin-tools/src/tools/ExecuteTool/                # 触发 deferred 工具的入口
packages/builtin-tools/src/tools/TeamCreateTool/             # 例子：deferred + runtime 守卫
```

## 相关笔记

- `.shousui/notes/subagent-spawn-mechanism.md` — AgentTool 的完整调用链和三种 subagent 形态对比
