# `src/keybindings` — 键盘绑定子系统

完整的键盘快捷键管理系统，支持默认绑定、用户自定义覆盖、冲突检测与平台适配。

## 主要文件

| 文件 | 职责 |
|------|------|
| `defaultBindings.ts` | 导出 `DEFAULT_BINDINGS: KeybindingBlock[]`，含平台差异处理（Windows VT 模式、IMAGE_PASTE_KEY、MODE_CYCLE_KEY）和 feature flag 门控绑定 |
| `types.ts` | 从 `@anthropic/ink` 重新导出核心类型（`ParsedBinding`、`KeybindingContextName`、`KeybindingBlock` 等） |
| `schema.ts` | 键盘绑定配置的 Zod schema |
| `parser.ts` | 快捷键字符串解析 |
| `resolver.ts` | 键盘事件与绑定的匹配解析 |
| `validate.ts` | 绑定有效性验证与冲突检测 |
| `loadUserBindings.ts` | 读取用户自定义配置（`~/.claude/keybindings.json`） |
| `reservedShortcuts.ts` | 保留键保护（不可被覆盖的系统快捷键） |
| `template.ts` | 配置文件模板生成 |
| `shortcutFormat.ts` | 快捷键显示格式化 |
| `KeybindingContext.tsx` | React Context |
| `KeybindingProviderSetup.tsx` | 应用启动时初始化 context |
| `useKeybinding.ts` | 快捷键订阅 hook |
| `useShortcutDisplay.ts` | 快捷键展示格式 hook |

## 支持的 Context

Global、Chat、Autocomplete、Settings、Confirmation、Transcript、Select、Scroll、Diff、Voice 等 20+ 个 context

## 依赖关系

- 类型来源：`@anthropic/ink`
- 被大量消费：`hooks/useCommandKeybindings.tsx`、`hooks/useGlobalKeybindings.tsx`
