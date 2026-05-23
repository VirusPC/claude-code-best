# `src/self-hosted-runner` — 自托管运行器（Stub）

自托管运行器（Self-Hosted Runner）的入口模块，目前为自动生成的占位 stub。

## 主要文件

| 文件 | 职责 |
|------|------|
| `main.ts` | 导出 `selfHostedRunnerMain(args: string[]): Promise<void>`，当前为空实现 |

## 说明

设计上应承载在自托管基础设施上运行 Claude Code 代理的启动逻辑，未来与 `server/` 或 `remote/` 协同工作。
