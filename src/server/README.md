# `src/server` — 本地 HTTP/WebSocket 服务器

本地服务器层，支持 Claude Code 的"直连"（direct connect）模式，允许外部客户端通过本地端口连接到正在运行的实例。

## 主要文件

| 文件 | 职责 |
|------|------|
| `server.ts` | 启动服务器（`startServer`） |
| `sessionManager.ts` | 会话生命周期管理（`SessionManager`，含 `destroyAll()`） |
| `directConnectManager.ts` | 直连流程处理 |
| `createDirectConnectSession.ts` | 创建直连会话 |
| `connectHeadless.ts` | 无头模式连接 |
| `parseConnectUrl.ts` | 连接 URL 解析 |
| `lockfile.ts` | 锁文件（防止多实例冲突） |
| `serverBanner.ts` | 服务器启动横幅 |
| `serverLog.ts` | 服务器日志 |
| `types.ts` | 服务器类型定义 |

## 子目录

| 子目录 | 职责 |
|--------|------|
| `backends/` | 不同传输后端实现（direct、dangerous） |

## 依赖关系

- 与 `remote/`（RemoteSessionManager）、`screens/REPL.tsx`、`bootstrap/state` 协同
- 多个文件为 auto-generated stub，核心实现待填充
