# `src/skills` — Slash Command 技能系统

管理所有 slash command（技能/Skill）的加载、注册与发现，支持三种技能来源。

## 主要文件

| 文件 | 职责 |
|------|------|
| `loadSkillsDir.ts` | **核心文件**（1087 行）：全部技能加载逻辑，frontmatter 解析、技能命令构建（`createSkillCommand`）、跨源去重（symlink-aware）、条件技能激活、动态技能发现 |
| `bundledSkills.ts` | 内置技能注册表：`registerBundledSkill`/`getBundledSkills`，含安全文件提取（`O_NOFOLLOW|O_EXCL`） |
| `mcpSkills.ts` | 从 MCP 服务器的 `skill://` 资源动态拉取技能，带 LRU 缓存 |
| `mcpSkillBuilders.ts` | MCP 技能构建工具 |

## 技能来源

1. **内置打包技能**（`bundledSkills.ts`）：编译进 CLI 二进制
2. **磁盘目录技能**：从 `~/.claude/skills/`、`.claude/skills/` 按优先级加载 SKILL.md 文件
3. **MCP 资源技能**：MCP 服务器暴露的 `skill://` 资源

## 技能激活条件

frontmatter `paths` 字段：仅在匹配路径时激活技能（路径条件激活）

## 依赖关系

- 依赖：`services/analytics`、`services/tokenEstimation`、`utils/frontmatterParser`、`utils/markdownConfigLoader`、`utils/settings`
- 被 `commands.ts`、REPL 入口消费，提供最终命令列表
