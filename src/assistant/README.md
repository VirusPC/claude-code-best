# `src/assistant` — KAIROS Assistant 模式

实现"Assistant（KAIROS）守护进程模式"，负责多代理团队的初始化与会话发现。

## 主要文件

| 文件 | 职责 |
|------|------|
| `index.ts` | 模块入口，导出 `isAssistantMode`、`initializeAssistantTeam`、`getAssistantSystemPromptAddendum` |
| `gate.ts` | GrowthBook 特性门控，判断是否启用 assistant 模式 |
| `sessionDiscovery.ts` | 通过 Sessions API 查询可附加的 assistant 会话列表 |
| `sessionHistory.ts` | 加载 assistant 专属的会话历史 |
| `AssistantSessionChooser.tsx` | 会话选择 UI 组件 |

## 依赖关系

- 依赖：`bootstrap/state.ts`（读取 `kairosActive`）、`utils/swarm/`（团队管理）、`utils/teleport/api.js`（会话列表 API）
- 被调用：`main.tsx` 在启动时调用，feature flag `BUDDY`/`KAIROS` 控制
