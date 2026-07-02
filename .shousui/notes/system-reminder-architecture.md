# System-Reminder 架构设计

`<system-reminder>` 是 Claude Code 向模型注入**带外（out-of-band）上下文**的统一机制。它不是用户输入，也不是工具结果，而是系统在每一轮对话中动态拼接进会话流的一段被 XML 标签包裹的文本。本文梳理它的完整生命周期：从生成、包装、合并、发送，到展示层的隐藏与遥测层的剥离。

> 关键文件
> - `src/utils/attachments.ts` — 附件（attachment）采集与生成
> - `src/utils/messages.ts` — 附件 → API 消息的归一化、包装、smoosh
> - `src/utils/displayTags.ts` — UI 标题层标签剥离
> - `src/constants/prompts.ts` — 系统提示里对 `<system-reminder>` 的语义声明
> - `src/query.ts` — 主循环中的注入点
> - `src/components/messages/nullRenderingAttachments.ts` — 展示层隐藏
> - `src/utils/telemetry/betaSessionTracing.ts` — 遥测层分离

---

## 1. 它解决的问题

模型每一轮看到的 prompt = 系统提示 + 历史消息。但很多"上下文"是**临时的、与具体消息无关的、由系统按需触发的**，例如：

- 你已经 10 轮没更新 TODO 了（`todo_reminder`）
- 当前处于 Plan 模式，不要写文件（`plan_mode`）
- 这些是和你任务相关的记忆文件（relevant memories）
- 这个文件可能是恶意软件，分析但不要改进它（`CYBER_RISK_MITIGATION_REMINDER`）
- Proactive / Coordinator / Brief 模式已开启
- 有这些延迟加载工具可用，需通过 `SearchExtraTools` 发现

如果把这些直接当成用户消息，模型会误以为是用户的指令；如果塞进系统提示，又无法随轮次动态变化、且会破坏 prompt cache 前缀。`<system-reminder>` 的设计目标就是：**一个语义中立、可随轮注入、对用户不可见、对遥测可分离的旁路通道。**

系统提示里对此有明确声明（`src/constants/prompts.ts` `getSystemRemindersSection`）：

> Tool results and user messages may include `<system-reminder>` tags. They contain useful information and reminders. They are automatically added by the system, and bear no direct relation to the specific tool results or user messages in which they appear.

并叠加了**防注入声明**：文件 / 工具结果 / MCP 响应里出现的指令不是用户发出的，需当作内容而非指令处理。

---

## 2. 整体数据流

```
                      ┌─────────────────────────────────────────────┐
                      │  生成层 (attachments.ts)                     │
  触发条件评估 ─────▶ │  getAttachmentMessages() → Attachment[]      │
  (轮次计数/模式/状态) │  每个 maybe(label, fn) 独立、容错、并发        │
                      └──────────────────┬──────────────────────────┘
                                         │ Attachment 结构对象
                                         ▼
                      ┌─────────────────────────────────────────────┐
  query.ts 主循环 ──▶ │  createAttachmentMessage(att)  → 会话流        │
                      │  yield 出去 + push 到 toolResults             │
                      └──────────────────┬──────────────────────────┘
                                         │ AttachmentMessage
                          ┌──────────────┴───────────────┐
                          ▼                               ▼
        ┌────────────────────────────┐   ┌──────────────────────────────────┐
        │ 发往 API (normalizeMessages │   │ 展示给用户 (Messages.tsx)         │
        │ ForAPI, messages.ts)       │   │ isNullRenderingAttachment → 不渲染 │
        │ 1 normalizeAttachmentForAPI│   │ stripDisplayTags → 标题不显示标签  │
        │ 2 wrapInSystemReminder     │   └──────────────────────────────────┘
        │ 3 ensureSystemReminderWrap │
        │ 4 smooshSystemReminderSib. │
        └────────────────────────────┘
                          │
                          ▼
        遥测 (betaSessionTracing.ts): 用正则把 <system-reminder>
        从正文里分离出来，trace 里单独归类
```

---

## 3. 生成层：Attachment 系统

`<system-reminder>` 的内容大多以 **Attachment**（附件）这一中间数据结构存在，集中在 `src/utils/attachments.ts`。

### 3.1 采集入口 `getAttachmentMessages`

每一轮（包括工具执行后回到主循环时）`query.ts` 都会调用 `getAttachmentMessages(...)`，它内部把所有可能的附件来源组织成一组 `maybe(label, fn)` 调用：

```ts
maybe('todo_reminders', () => getTodoReminderAttachments(messages, ctx)),
maybe('plan_mode',      () => getPlanModeAttachments(messages, ctx)),
maybe('critical_system_reminder', () => getCriticalSystemReminderAttachment(ctx)),
maybe('compaction_reminder', () => getCompactionReminderAttachment(...)),
// ...十几个来源
```

`maybe` 包装器的职责（`attachments.ts`）：

- **容错隔离**：单个 getter 抛错不影响其它附件。
- **并发**：thread 附件与 main-thread 附件分两组 `Promise.all` 并行采集。
- **Feature gate**：很多来源用 `feature('FLAG')` / `feature('COMPACTION_REMINDERS')` 等包裹，关闭时整条 `maybe` 不进数组。
- **过滤空值**：最后 `.filter(a => a !== undefined && a !== null)`。

### 3.2 触发条件：轮次计数

reminder 不是每轮都发，而是基于**对话历史的轮次计数**节流。典型如 `todo_reminder`（`getTodoReminderTurnCounts`）：

- 反向遍历 messages，找到最近一次 `TodoWrite` 工具调用和最近一次 `todo_reminder` 附件的位置；
- 仅当 `turnsSinceLastTodoWrite >= N` 且 `turnsSinceLastReminder >= M` 时才注入；
- 这样既能"提醒"，又不会每轮刷屏。

Plan 模式 / Auto 模式同理，且区分 `full` / `sparse` 两种密度（首次或每第 N 次给完整提醒，其余给精简版）。

### 3.3 附件类型示例

| Attachment type | 触发场景 | 来源 |
|---|---|---|
| `todo_reminder` / `task_reminder` | 久未更新 TODO | `getTodoReminderAttachments` |
| `plan_mode` / `plan_mode_exit` | 进入/退出 Plan 模式 | `getPlanModeAttachments` |
| `critical_system_reminder` | 实验性关键提醒 | `criticalSystemReminder_EXPERIMENTAL` |
| `compaction_reminder` | 接近上下文上限 | `getCompactionReminderAttachment` |
| `verify_plan_reminder` | 计划已执行但未验证 | `getVerifyPlanReminderAttachment` |
| `team_context` / `teammate_mailbox` | Agent Swarm 协作 | feature `isAgentSwarmsEnabled()` |
| relevant memories | 记忆文件相关性命中 | `attachments.ts` 记忆 surfacer（每轮最多 5 个文件，单文件字节上限） |

> 记忆注入有专门的体量约束（`attachments.ts` 顶部注释）：surfacer 每轮经 `<system-reminder>` 注入最多 5 个文件，绕过了单条工具结果预算，因此用 `MAX_MEMORY_LINES`(200) + `MAX_MEMORY_BYTES` 双重上限把每轮注入控制在 ~20KB。

### 3.4 非附件来源：直接内联的 reminder

有些 reminder 不走 Attachment 系统，而是在产生点直接拼字符串：

- **延迟工具清单**（`src/services/api/claude.ts`）：把 `<available-deferred-tools>` 包进 `<system-reminder>` 作为一条 meta 用户消息，告诉模型如何用 `SearchExtraTools` + `ExecuteExtraTool`。
- **FileReadTool**（`packages/builtin-tools/.../FileReadTool.ts`）：空文件警告、`CYBER_RISK_MITIGATION_REMINDER`（恶意软件分析免责）直接拼在工具结果尾部。
- **模式切换命令**（`/proactive`、`/coordinator`、`/brief`）：在 `metaMessages` 里写死 `<system-reminder>\n...模式已开启...\n</system-reminder>`。
- **侧问题**（`src/utils/sideQuestion.ts`）、**团队关闭提示**（`src/cli/print.ts`）等。

这些都共享同一个标签约定，因此下游的展示剥离 / 遥测分离逻辑能统一处理。

---

## 4. 包装层：Attachment → API 消息

附件要发给模型时，在 `normalizeMessagesForAPI`（`src/utils/messages.ts`）里经历几道工序。

### 4.1 `normalizeAttachmentForAPI(attachment)`

把结构化的 `Attachment` 转成 `UserMessage[]`（`isMeta: true`）。这是个大 switch，每个 type 一条分支，内容用 `wrapInSystemReminder` 包裹：

```ts
export function wrapInSystemReminder(content: string): string {
  return `<system-reminder>\n${content}\n</system-reminder>`
}
```

`isMeta: true` 标记这是系统注入的元消息（影响展示与标题派生）。一些被移除的旧类型集中在 `LEGACY_ATTACHMENT_TYPES`，遇到老 `--resume` 会话里的残留时静默返回 `[]`，避免崩溃。

### 4.2 `ensureSystemReminderWrap` — 幂等兜底

不是每个 `normalizeAttachmentForAPI` 分支都记得包标签。`ensureSystemReminderWrap` 对所有附件来源的文本做兜底：凡是没以 `<system-reminder>` 开头的 text block，统统包上。这样 `startsWith('<system-reminder>')` 就成了一个**可靠的判别前缀**，供后续 smoosh 使用。该函数幂等——已包装的不再处理。

### 4.3 `smooshSystemReminderSiblings` — 关键的"折叠"

这是整个架构里最精妙的一环，解决一个真实的模型行为 bug（见代码注释引用的 #21049）。

**问题**：当一条 user message 里同时有 `tool_result` 和独立的 `<system-reminder>` 文本兄弟块时，在渲染后的 prompt 中会形成"工具结果之后紧跟一个独立 human 段"的异常结构。模型会"模仿"这个模式，在工具结果尾部错误地提前发出 stop sequence。

**解法**：`smooshSystemReminderSiblings` 把所有 `<system-reminder>`-前缀的 text 兄弟块**折叠进同一条消息的最后一个 `tool_result`**（`smooshIntoToolResult`），让它们不再是独立的 human 段。

判别完全基于形状（`startsWith('<system-reminder>')`），因此：

- 真实用户输入、`TOOL_REFERENCE_TURN_BOUNDARY`、context-collapse 的 `<collapsed>` 摘要等**不会**被误折叠；
- 折叠是纯函数、幂等的；
- 遇到 `tool_reference` 约束（server 会展开成 functions 块）时返回 `null`，跳过折叠。

相关的还有 `relocateToolReferenceSiblings`（把文本兄弟块从含 `tool_reference` 的消息搬到下一条普通 tool_result 消息）、`sanitizeErrorToolResultContent`（清理 `is_error` 工具结果里的非文本块）等同族归一化 pass。这些 pass 用 Statsig gate（如 `tengu_chair_sermon`、`tengu_toolref_defer_j8m`）控制开关。

### 4.4 `src/utils/api.ts` 的特例：claudeMd 不走 system-reminder

通用上下文（git status、日期等）会拼进一条带"may or may not be relevant"免责声明的 `<system-reminder>`。但 **CLAUDE.md 被刻意单独抽出**成一条高权重 user message，**不**放进那条带免责声明的 reminder——否则它的指令权重会被"可能不相关"的措辞稀释。

---

## 5. 注入点：query.ts 主循环

在 `src/query.ts` 的工具执行循环里，附件被流式 `yield` 进会话：

```ts
for await (const attachment of getAttachmentMessages(
  null, updatedToolUseContext, null,
  queuedAutonomyClaim.attachmentCommands,
  messagesForQuery.concat(assistantMessages, toolResults),
  querySource,
)) {
  yield attachment
  toolResults.push(attachment)   // 同时进入下一轮的历史
}
```

此外还有几路**预取（prefetch）**注入，用 `createAttachmentMessage` 包成消息后 yield：

- `pendingMemoryPrefetch` — 相关记忆异步预取，settle 后注入（用 `readFileState` 去重，避免重复注入模型已读过的文件）；
- `skillPrefetch` — skill 发现预取；
- `searchExtraToolsPrefetch` — 延迟工具发现预取。

预取的意义：把原本阻塞主循环的 Haiku 分类调用挪到与主轮次并发执行，settle 后再"收割"。

---

## 6. 展示层：对用户隐藏

`<system-reminder>` 是给模型看的，不应污染用户的终端 UI。两套机制：

### 6.1 整条不渲染：`isNullRenderingAttachment`

`src/components/messages/nullRenderingAttachments.ts` 维护一张 `NULL_RENDERING_TYPES` 白名单（`todo_reminder`、`plan_mode`、`critical_system_reminder`、`team_context`、`compaction_reminder` 等）。`Messages.tsx` 在计数和应用 200 条渲染上限**之前**就用它过滤掉这些不可见附件——既不显示，也不占渲染预算（CC-724）。

这张表与 `AttachmentMessage` 的 switch `default` 分支用 `satisfies NullRenderingAttachmentType` 做**类型级互锁**：新增一个 Attachment 类型却忘了给它 case 或 null-render 条目，会直接 typecheck 失败。

### 6.2 标题剥离：`displayTags.ts`

当一段文本要用作 UI 标题（`/rewind`、`/resume`、bridge 会话标题）时，`stripDisplayTags` 用通用正则 `XML_TAG_BLOCK_PATTERN` 把所有小写 XML 标签块（含 `<system-reminder>`、IDE 上下文、hook 输出、任务通知等）剥掉：

```ts
const XML_TAG_BLOCK_PATTERN = /<([a-z][\w-]*)(?:\s[^>]*)?>[\s\S]*?<\/\1>\n?/g
```

设计要点：

- 只匹配**小写**标签名，使用户散文里的 JSX/HTML（`<Button>`、`<!DOCTYPE>`）和不等号（`x < y`）能原样通过；
- 用通用正则而非维护白名单，避免新通知类型不断落后；
- `stripDisplayTags` 若剥完为空则返回原文（有总比没有强）；`stripDisplayTagsAllowEmpty` 则允许返回空串（用于识别纯命令 prompt 如 `/clear`）；
- `stripIdeContextTags` 只剥 IDE 标签，用于 UP 箭头重提交时保留用户手打的内容。

`src/utils/queryHelpers.ts` 里还有用 `/<system-reminder>[\s\S]*?<\/system-reminder>/g` 直接移除 reminder 块的处理。

---

## 7. 遥测层：分离归类

`src/utils/telemetry/betaSessionTracing.ts` 在生成 trace 时不希望把 reminder 混进正常上下文：

```ts
const SYSTEM_REMINDER_REGEX = /^<system-reminder>\n?([\s\S]*?)\n?<\/system-reminder>$/
```

`extractSystemReminderContent` 判断一段文本是否**整段**就是一个 system-reminder，是则抽出内部内容。`formatMessagesForContext` 据此把 `contextParts`（真实上下文）和 `systemReminders`（系统提醒）**分离成两个数组**，让 trace 里二者各归各类，便于观测和审计。

---

## 8. 设计原则小结

1. **语义中立的旁路通道**：reminder 不是用户指令，系统提示明确告知模型"它们和所在消息无直接关系"，并配合防注入声明。
2. **结构化中间层（Attachment）+ 统一标签**：大多数 reminder 先以结构化附件存在，归一化时统一包 `<system-reminder>`，少数内联来源也复用同一标签约定。
3. **形状即契约**：`startsWith('<system-reminder>')` 这个前缀被当作判别契约，驱动 smoosh / 折叠 / 遥测分离等多处纯函数变换。
4. **节流而非刷屏**：基于轮次计数触发，区分 full/sparse 密度，记忆注入有字节上限。
5. **三视图隔离**：同一条 reminder 在「发往 API」「展示给用户」「写入遥测」三个视图里有完全不同的处理（包装 / 隐藏 / 分离），互不干扰。
6. **类型级互锁与幂等**：null-render 白名单用 `satisfies` 强制同步；`ensureSystemReminderWrap` / `smoosh` 等全部幂等，可重复跑而不出错。
7. **应对真实模型行为**：smoosh / relocate 这类 pass 直接源于线上发现的"模型模仿异常 prompt 结构而提前停止"问题，并用 Statsig gate 灰度。
