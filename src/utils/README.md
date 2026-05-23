# `src/utils` — 基础设施工具库

全项目最大的基础设施工具库（300+ 文件），提供所有上层模块所需的底层工具。

## 主要子目录

| 子目录 | 关注域 |
|--------|--------|
| `settings/` | 全局设置读写、类型定义，是 `state/AppStateStore` 初始化的基础 |
| `permissions/` | 工具权限模式、bypass 模式、拒绝追踪，影响所有工具调用安全逻辑 |
| `hooks/` | 后采样 hook、会话 hook，扩展 AI 响应后置处理 |
| `model/` | 模型选择、provider 解析、能力查询 |
| `shell/` | Shell 命令执行、环境变量管理 |
| `sandbox/` | 沙箱安全模式 |
| `memory/` | 记忆文件操作工具 |
| `todo/` | TODO 管理工具 |
| `task/` | 任务框架（注册/状态更新） |
| `swarm/` | Swarm 多代理工具 |
| `messages/` | 消息处理工具 |
| `telemetry/` | 遥测数据工具 |
| `plugins/` | 插件工具函数 |
| `mcp/` | MCP 工具函数 |
| `skills/` | 技能工具函数 |
| `suggestions/` | 输入建议工具 |

## 关键独立文件

| 文件 | 职责 |
|------|------|
| `auth.ts` | 认证工具（API key、OAuth） |
| `config.ts` | 全局/项目配置读写 |
| `git.ts` | Git 操作工具 |
| `log.ts` | 日志工具 |
| `debug.ts` | 调试工具 |
| `platform.ts` | 平台检测 |
| `env.ts` | 环境变量工具 |

## 设计原则

- 是真正的底层基础设施，不依赖 `services/`、`tasks/`、`state/` 等上层模块
- 仅依赖外部 npm 包（Bun 内置、`@anthropic-ai/sdk` 等）
- 被全项目几乎所有模块依赖
