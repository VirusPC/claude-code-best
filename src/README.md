# `src/` — 源码目录总览

本目录包含 Claude Code CLI 的全部源代码，按功能领域划分为 40 个子目录。

## 架构分层

```
┌─────────────────────────────────────────────────────┐
│                   entrypoints/                      │  CLI 入口 & SDK 类型
├─────────────────────────────────────────────────────┤
│           screens/          commands/               │  顶层 UI 屏幕 & Slash Commands
├──────────────┬──────────────────────────────────────┤
│  components/ │  hooks/   keybindings/  context/     │  UI 组件层
├──────────────┴──────────────────────────────────────┤
│        QueryEngine  ←  query/  ←  services/api/     │  查询核心循环
├─────────────────────────────────────────────────────┤
│   state/        tasks/        skills/               │  状态管理 & 任务 & 技能
├─────────────────────────────────────────────────────┤
│                   services/                         │  后端服务（API、MCP、语音等）
├──────────────────────────┬──────────────────────────┤
│        utils/            │      bootstrap/          │  基础工具库 & 全局单例状态
├──────────────────────────┴──────────────────────────┤
│   types/    constants/    schemas/                  │  类型 & 常量（DAG 叶节点）
└─────────────────────────────────────────────────────┘
```

## 子目录索引

### 入口与启动

| 目录 | 说明 |
|------|------|
| [entrypoints/](./entrypoints/README.md) | CLI 零号入口（`cli.tsx`）、一次性初始化（`init.ts`）、SDK 公开类型 |
| [bootstrap/](./bootstrap/README.md) | 进程级全局单例状态（150+ getter/setter），整个应用的状态基础设施 |
| [migrations/](./migrations/README.md) | 启动时按需执行的一次性配置迁移脚本（幂等） |

### 核心查询循环

| 目录 | 说明 |
|------|------|
| [query/](./query/README.md) | `query()` 主查询循环的支撑模块（配置快照、依赖注入、token 预算、stop hooks） |
| [services/](./services/README.md) | 全项目最大服务层：API 客户端（6 个 provider）、MCP、语音、工具编排、记忆、压缩等 |

### UI 层

| 目录 | 说明 |
|------|------|
| [screens/](./screens/README.md) | 顶层 UI 屏幕：`REPL.tsx`（主交互循环）、`Doctor.tsx`（诊断）、`ResumeConversation.tsx` |
| [components/](./components/README.md) | 全部 Ink TUI 组件（150+ 文件），包含消息列表、权限对话框、diff、design-system 等 |
| [hooks/](./hooks/README.md) | REPL 交互行为逻辑的 React Hooks 集合（~80 个 hook） |
| [context/](./context/README.md) | React Context Providers：stats、mailbox、notifications、modal、overlay、voice 等 |
| [keybindings/](./keybindings/README.md) | 完整键盘绑定子系统（默认绑定、用户覆盖、冲突检测、平台适配） |

### 命令与技能

| 目录 | 说明 |
|------|------|
| [commands/](./commands/README.md) | 所有 slash command 实现（`/init`、`/compact`、`/mcp`、`/commit` 等 40+ 命令） |
| [skills/](./skills/README.md) | Slash Command 技能系统（内置打包、磁盘目录、MCP 资源三种来源） |
| [plugins/](./plugins/README.md) | 内置插件注册表（可通过 `/plugin` UI 启用/禁用） |

### 状态与任务

| 目录 | 说明 |
|------|------|
| [state/](./state/README.md) | 全局 UI 状态管理（自定义发布-订阅 Store，`AppState` 含数百个字段） |
| [tasks/](./tasks/README.md) | 后台任务系统（LocalAgent、RemoteAgent、Teammate、Shell、Workflow、Dream 等类型） |
| [jobs/](./jobs/README.md) | 模板化异步 Job 的磁盘状态持久化（`~/.claude/jobs/<jobId>/`） |

### 功能模块

| 目录 | 说明 |
|------|------|
| [bridge/](./bridge/README.md) | Remote Control Bridge：本地 CLI 与 CCR 后端/移动端的连接层（`BRIDGE_MODE`） |
| [remote/](./remote/README.md) | 远端 CCR 容器通信层（WebSocket 订阅、HTTP 消息、权限请求/响应流） |
| [server/](./server/README.md) | 本地 HTTP/WebSocket 服务器，支持外部客户端直连（direct connect 模式） |
| [ssh/](./ssh/README.md) | SSH 远程模式：本地 UI 与远端 Claude 进程的双向 JSON 流通信 |
| [daemon/](./daemon/README.md) | 后台守护进程 Supervisor（指数退避重启、DAEMON feature） |
| [coordinator/](./coordinator/README.md) | 多 Agent 协调模式（`COORDINATOR_MODE`），Coordinator 并发派发 Worker |
| [memdir/](./memdir/README.md) | 持久化记忆系统（Memory Directory），管理 Markdown 记忆文件并注入系统提示 |
| [proactive/](./proactive/README.md) | 主动自主代理模式（每 30s tick，驱动模型在用户空闲时持续工作） |
| [assistant/](./assistant/README.md) | KAIROS Assistant 模式：多代理团队初始化与会话发现 |
| [buddy/](./buddy/README.md) | Companion/Buddy 游戏化功能（虚拟伴侣，确定性随机生成） |
| [voice/](./voice/README.md) | 语音模式功能开关（GrowthBook gate + OAuth 检查） |
| [vim/](./vim/README.md) | 输入框 Vim 编辑模式（显式状态机，支持 motion/operator/textObject/dot-repeat） |
| [outputStyles/](./outputStyles/README.md) | 用户自定义 AI 输出样式配置加载 |
| [upstreamproxy/](./upstreamproxy/README.md) | CCR 容器出站 HTTPS 代理（CA 证书下载、CONNECT→WebSocket 中继） |

### 基础设施

| 目录 | 说明 |
|------|------|
| [utils/](./utils/README.md) | 基础工具库（300+ 文件）：auth、config、git、permissions、settings、model、shell 等 |
| [cli/](./cli/README.md) | CLI 运行时支撑：后台任务引擎、网络传输层（WebSocket/SSE/Hybrid）、I/O、更新 |
| [native-ts/](./native-ts/README.md) | 纯 TS 实现的原生模块替代（模糊文件搜索索引，替代 Rust NAPI） |

### 类型与配置

| 目录 | 说明 |
|------|------|
| [types/](./types/README.md) | 全项目共享 TypeScript 类型（消息、权限、命令、工具、ID 等）及 `.d.ts` 声明 |
| [constants/](./constants/README.md) | 全局只读常量（产品 URL、系统提示、API 限制、工具白名单、OAuth 端点等） |
| [schemas/](./schemas/README.md) | 共享 Zod Schema（从其他模块提取以打破循环依赖） |

### Stub / 占位

| 目录 | 说明 |
|------|------|
| [environment-runner/](./environment-runner/README.md) | 环境运行器（自动生成占位 stub，真实实现内部保留） |
| [self-hosted-runner/](./self-hosted-runner/README.md) | 自托管运行器（自动生成占位 stub） |
| [moreright/](./moreright/README.md) | MoreRight 功能 hook（外部构建 stub，内部构建注入真实实现） |

### 测试

| 目录 | 说明 |
|------|------|
| [__tests__/](./tests/README.md) | 顶级集成/单元测试（工具权限、bridge 安全、上下文基线、自主性边界等） |

## 依赖层次

```
types / constants / schemas          ← DAG 叶节点，无内部依赖
        ↓
  bootstrap / utils                  ← 基础设施，仅依赖外部包
        ↓
     services                        ← 后端服务层
        ↓
  state / tasks / skills / memdir    ← 业务逻辑层
        ↓
 context / hooks / keybindings       ← UI 支撑层
        ↓
     components                      ← UI 组件层
        ↓
      screens                        ← 顶层 UI（依赖树顶端）
```

`commands/`、`bridge/`、`coordinator/`、`daemon/` 等功能模块横跨多层，通过 `bootstrap/state` 和 `services/` 与核心循环交互。
