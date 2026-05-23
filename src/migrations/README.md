# `src/migrations` — 配置迁移脚本

用户配置的一次性升级迁移集合，在应用启动时按需执行，保证配置向后兼容。

## 迁移列表

| 文件 | 迁移内容 |
|------|---------|
| `migrateFennecToOpus.ts` | 将内部 `fennec-latest*` 别名迁移到 `opus`（仅 `USER_TYPE=ant`） |
| `migrateSonnet45ToSonnet46.ts` | 将 `userSettings.model` 从 sonnet-4-5 更新为 `sonnet` |
| `migrateLegacyOpusToCurrent.ts` | 旧版 Opus 别名更新 |
| `migrateBypassPermissionsAcceptedToSettings.ts` | 权限接受状态迁移至设置 |
| `migrateEnableAllProjectMcpServersToSettings.ts` | MCP 服务器配置迁移 |
| `migrateReplBridgeEnabledToRemoteControlAtStartup.ts` | Bridge 启动配置迁移 |
| `resetProToOpusDefault.ts` | Pro 用户订阅默认模型重置 |
| `resetAutoModeOptInForDefaultOffer.ts` | Auto mode 默认重置 |

## 设计原则

- 每个迁移函数**幂等**，可安全重复执行
- 迁移附 analytics 事件上报
- 全部迁移函数在 `init.ts` 或 bootstrap 流程中集中调用

## 依赖关系

- 依赖：`utils/settings/settings`、`utils/config`、`utils/auth`、`services/analytics`
