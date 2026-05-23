# `src/bootstrap` — 全局单例状态

整个应用的进程级共享状态存储，是所有模块的状态基础设施。

## 主要文件

| 文件 | 职责 |
|------|------|
| `state.ts` | 唯一文件，定义 `State` 类型与 `getInitialState()`，导出约 150+ 个状态访问函数 |

## 包含状态

- 会话 ID、费用统计、API 调用时长
- 模型用量、token 计数、当前工作目录
- 遥测 meters、feature flags、cron 任务
- 插件列表、权限模式等所有进程级共享状态

## 设计原则

- 设计为 import DAG 的**叶节点**，仅依赖极少量工具（`crypto.js`、`settingsCache.js`、`signal.js`）
- 严格禁止外部直接访问内部 `STATE` 对象，所有访问必须通过导出的 getter/setter 函数
- 几乎被所有其他模块引用
