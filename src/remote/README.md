# `src/remote` — 远端 CCR 通信层

实现与远端 CCR（Claude Code Runner）容器的完整通信层，支持 WebSocket 订阅、HTTP 消息发送和权限请求/响应流。

## 主要文件

| 文件 | 职责 |
|------|------|
| `RemoteSessionManager.ts` | 核心会话管理器：通过 WebSocket 订阅接收 SDK 消息和权限请求，通过 HTTP POST 向远端发送用户消息，处理权限请求/响应流 |
| `SessionsWebSocket.ts` | WebSocket 连接封装：指数退避重连、ping 保活、mTLS/代理支持 |
| `remotePermissionBridge.ts` | 为远端权限请求创建合成 AssistantMessage 和工具 stub |
| `sdkMessageAdapter.ts` | SDK 消息格式转换适配 |

## 依赖关系

- 依赖：`entrypoints/sdk/controlTypes`、`utils/teleport/api`、`utils/mtls`、`utils/proxy`
- 被远程会话 REPL 流程和 `screens/` 中远程连接屏调用
