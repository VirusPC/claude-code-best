# `src/__tests__` — 顶级集成/单元测试

覆盖跨模块核心逻辑的测试用例，使用 Bun 测试框架。

## 测试文件

| 文件 | 覆盖范围 |
|------|---------|
| `tools.test.ts` | `parseToolPreset`、`filterToolsByDenyRules` 等工具选择逻辑 |
| `commandsBridgeSafety.test.ts` | Bridge 命令的安全性约束验证 |
| `context.baseline.test.ts` | 系统上下文构建的基线断言 |
| `handlePromptSubmit.test.ts` | 提示提交流程 |
| `history.test.ts` | 历史记录操作 |
| `queryAutonomyProviderBoundary.test.ts` | 自主性边界与 provider 隔离 |
| `Tool.test.ts` | 工具接口基础行为 |

## 说明

这些测试属于外部测试层，直接引用 `../tools`、`../Tool`、`../bridge/`、`../context/` 等顶级模块，不被其他模块导入。
