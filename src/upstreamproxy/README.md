# `src/upstreamproxy` — 出站 HTTPS 代理

在 CCR（Claude Code Remote）容器内的出站 HTTPS 代理支持，为容器内所有子进程注入代理配置。

## 主要文件

| 文件 | 职责 |
|------|------|
| `upstreamproxy.ts` | **主入口**（286 行）：`initUpstreamProxy()` 完成初始化全流程；`getUpstreamProxyEnv()` 供 `utils/subprocessEnv` 调用以注入子进程环境变量 |
| `relay.ts` | 实现本地 HTTP CONNECT 代理到 WebSocket 的中继服务器 |

## 初始化流程

1. 读取 session token
2. 下载代理 CA 证书（合并至系统 CA bundle）
3. 启动本地 CONNECT→WebSocket 中继（`relay.ts`）
4. 通过 `HTTPS_PROXY`、`SSL_CERT_FILE`、`NO_PROXY` 环境变量注入所有子进程

## 安全特性

- 通过 `prctl(PR_SET_DUMPABLE, 0)` 防止 token 被 ptrace 读取
- **Fail-open**：任何步骤失败仅禁用代理，不影响正常会话

## 依赖关系

- 由 `init.ts` 启动时调用一次
- `getUpstreamProxyEnv()` 被 `utils/subprocessEnv.ts` 调用
- 依赖：`utils/cleanupRegistry`、`utils/debug`、`utils/envUtils`、`utils/errors`
