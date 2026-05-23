# `src/bridge` — Remote Control Bridge

允许本地 CLI 通过 Anthropic CCR（Cloud Code Runtime）后端与 claude.ai/code 或移动端连接的 Bridge 层。

Feature flag: `BRIDGE_MODE`

## 主要文件

| 文件 | 职责 |
|------|------|
| `bridgeMain.ts` | 入口，含 `bridgeMain`/`runBridgeLoop`/`runBridgeHeadless`，管理整个 bridge 生命周期 |
| `bridgeApi.ts` | REST API 客户端，封装 poll/ack/heartbeat/stopWork 等端点 |
| `sessionRunner.ts` | 子进程 session 的 spawn/kill 管理 |
| `bridgeMessaging.ts` | 消息收发（入站/出站） |
| `replBridge.ts` | REPL Bridge（WebSocket/SSE 双向消息通道） |
| `bridgeConfig.ts` | Bridge 配置读取与验证 |
| `inboundMessages.ts` | 入站消息处理 |
| `types.ts` | Bridge 相关类型定义 |

## 核心流程

主轮询循环（`runBridgeLoop`）：
1. 从服务器拉取 work items
2. 生成/管理子进程 session
3. 处理 JWT 刷新、心跳保活
4. 优雅关闭与 worktree 隔离

## 依赖关系

- 依赖：`bootstrap/state.ts`、`services/analytics/`、`utils/auth.js`、`utils/git.js`、`utils/worktree.js`
- 被调用：`commands/remote-control`（通过 `bridgeMain`）和 daemon worker
