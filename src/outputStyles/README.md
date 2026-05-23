# `src/outputStyles` — 输出样式加载

从磁盘加载用户自定义的 AI 输出样式配置文件。

## 主要文件

| 文件 | 职责 |
|------|------|
| `loadOutputStylesDir.ts` | 异步加载输出样式，带 memoize 缓存；导出 `getOutputStyleDirStyles(cwd)` 和 `clearOutputStyleCaches()` |

## 加载路径

1. `.claude/output-styles/`（项目级）
2. `~/.claude/output-styles/`（用户级）

## 配置格式

Markdown 文件，frontmatter 作为元数据，文件内容作为提示词：

```markdown
---
name: 样式名称
description: 样式描述
---

输出样式提示词内容...
```

## 依赖关系

- 依赖：`constants/outputStyles`、`utils/markdownConfigLoader`、`utils/plugins/loadPluginOutputStyles`
- 被输出样式选择逻辑及插件系统调用
