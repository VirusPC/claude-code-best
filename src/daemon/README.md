# `src/daemon` — 后台守护进程

后台守护进程管理模块，作为进程监督者（supervisor）管理长驻 worker 的生命周期。

Feature flag: `DAEMON`

## 主要文件

| 文件 | 职责 |
|------|------|
| `main.ts` | `daemonMain()` 入口；`runSupervisor()` 启动并监督 worker 子进程，含指数退避（2s→120s）和"停车"（park）机制，写入 state 文件 |
| `workerRegistry.ts` | `runDaemonWorker()` 根据 `kind` 分发；`runRemoteControlWorker()` 调用 `runBridgeHeadless()` 并处理优雅关闭及退出码（78 永久错误/1 瞬时错误） |
| `state.ts` | 管理 `~/.claude/` 下的 daemon state 文件（供其他进程查询状态） |

## Supervisor 机制

- 指数退避重启崩溃 worker（2s → 120s）
- "停车"（park）机制：连续崩溃超限后暂停重启
- 支持 SIGTERM/SIGINT 优雅关闭

## CLI 子命令

`claude daemon start/stop/status/bg/attach/logs/kill`

## 依赖关系

- 依赖：`bridge/bridgeMain.js`（headless bridge）、`utils/cliLaunch.js`（spawn CLI 子进程）、`utils/auth.js`（OAuth token）
- 被调用：`cli.tsx` 通过 `claude daemon` 命令
