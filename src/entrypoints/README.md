# `src/entrypoints` — 应用入口与公共类型

应用的顶层入口文件与对外公开的类型导出层。

## 主要文件

| 文件 | 职责 |
|------|------|
| `cli.tsx` | **CLI 零号入口**，做运行时环境初始化（性能 shim、TTY 强制、堆内存限制），然后通过动态 import 按需路由（`--version` 快速路径、daemon worker、init、mcp 等） |
| `init.ts` | 一次性初始化（遥测、配置、信任对话框） |
| `mcp.ts` | MCP server 独立运行模式入口 |
| `agentSdkTypes.ts` | Agent SDK 公开类型汇聚导出 |
| `sandboxTypes.ts` | 沙箱类型定义 |

## `sdk/` 子目录

对外导出的 SDK 公共类型接口，供第三方和内部模块引用：

- `coreTypes.ts` — 核心类型（消息、工具、配置）
- `controlTypes.ts` — 控制类型（权限、中断）
- `runtimeTypes.ts` — 运行时类型
- `toolTypes.ts` — 工具类型

## 设计原则

`cli.tsx` 几乎不直接 import 业务模块，全部通过动态 `import()` 按需加载，以最小化冷启动开销。构建系统以此文件作为最终打包入口。
