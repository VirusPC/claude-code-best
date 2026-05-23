# `src/ssh` — SSH 远程模式

支持 Claude Code 通过 SSH 连接到远端 Claude 进程，在本地 UI 与远程进程之间双向传递 JSON 消息。

## 主要文件

| 文件 | 职责 |
|------|------|
| `SSHSessionManager.ts` | **核心实现**（354 行）：`SSHSessionManager` 接口和 `SSHSessionManagerImpl` 类，管理与远端子进程的全双工 JSON 流通信，含自动重连逻辑 |
| `createSSHSession.ts` | 封装 SSH 连接建立（spawn SSH 子进程）及初始化 |
| `SSHAuthProxy.ts` | SSH 认证代理 |
| `SSHDeploy.ts` | SSH 部署工具 |
| `SSHProbe.ts` | SSH 连通性探测 |

## 重连机制

- 最多 3 次自动重连
- 指数退避策略
- 心跳过滤

## 消息协议

本地 UI ↔ 远端子进程：全双工 JSON 流（SDK 消息、权限请求/响应、中断信号）

## 依赖关系

- 依赖：`utils/debug`、`utils/slowOperations`（JSON 序列化）、`utils/teleport/api`（RemoteMessageContent 类型）
- 被远程连接 UI 组件和 `tasks/RemoteAgentTask` 消费
