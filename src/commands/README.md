# `src/commands` — Slash Commands 实现

所有 slash command（`/command`）的实现集合，每个子目录对应一个用户可调用的命令。

## 命令目录（部分）

| 目录 | 命令功能 |
|------|---------|
| `add-dir/` | 添加工作目录 |
| `advisor/` | AI 建议助手 |
| `agents/` | Agent 管理 |
| `commit/` | Git 提交（含 push/PR 流程） |
| `compact/` | 上下文压缩 |
| `config/` | 配置查看/修改 |
| `help/` | 帮助信息 |
| `history/` | 会话历史 |
| `init/` | 生成 CLAUDE.md（支持新旧两套 prompt 策略） |
| `login/` `logout/` | 认证管理 |
| `mcp/` | MCP 服务器管理 |
| `memory/` | 记忆管理 |
| `model/` | 模型切换 |
| `plan/` | 规划模式 |
| `plugin/` | 插件管理 |
| `resume/` | 会话恢复 |
| `review/` | 代码审查 |
| `schedule/` | 任务调度 |
| `skills/` | 技能管理 |
| `theme/` | 主题切换 |
| `usage/` | 用量统计 |
| `vault/` | 密钥管理 |
| `voice/` | 语音模式 |
| `workflows/` | 工作流管理 |

## 说明

- 各命令独立实现，共同依赖 `utils/`、`bootstrap/state.ts`、`constants/`
- `createMovedToPluginCommand.ts` 为迁移至插件的命令创建兼容包装
- 被 `commands.ts`（命令注册表）统一注册后由 REPL 分发
