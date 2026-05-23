# `src/environment-runner` — 环境运行器（Stub）

环境运行器模块占位，目前为自动生成的空 stub。

## 主要文件

| 文件 | 职责 |
|------|------|
| `main.ts` | 导出 `environmentRunnerMain: () => Promise<void>`，当前为空实现 |

## 说明

此模块在未启用对应 feature flag 时作为构建占位或类型满足，真实实现为内部保留。设计上应承载在特定环境中运行 Claude Code 代理的启动逻辑。
