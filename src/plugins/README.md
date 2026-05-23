# `src/plugins` — 内置插件注册表

管理内置插件（Built-in Plugin）的注册、查询与启用/禁用状态。

## 主要文件

| 文件 | 职责 |
|------|------|
| `builtinPlugins.ts` | 核心注册表：`registerBuiltinPlugin`、`getBuiltinPlugins`、`getBuiltinPluginSkillCommands`、`isBuiltinPluginId` |
| `bundled/` | 打包进 CLI 的内置插件实现 |
| `hooks.ts` | 插件生命周期 hooks |

## Plugin ID 格式

`{name}@builtin`

## 说明

内置插件区别于捆绑技能（bundled skills）：
- 内置插件可通过 `/plugin` UI 由用户**启用/禁用**，并持久化到用户设置
- 捆绑技能（`skills/bundledSkills.ts`）是始终可用的内置技能

## 依赖关系

- 依赖：`types/plugin`、`skills/bundledSkills`、`utils/settings/settings`
- 被 `/plugin` UI、技能命令系统和启动初始化流程调用
