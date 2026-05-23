# `src/jobs` — Job 系统

管理模板化异步任务（Job）的磁盘状态持久化。

## 主要文件

| 文件 | 职责 |
|------|------|
| `state.ts` | 定义 `JobState` 接口，提供 `createJob()`/`readJobState()`/`appendJobReply()` 操作 `~/.claude/jobs/<jobId>/` 目录结构 |
| `classifier.ts` | 在每轮 REPL 主线程结束后分析 assistant 消息，判断 job 状态（running/completed）并回写 state.json |
| `templates.ts` | 管理 job 模板内容 |

## 磁盘目录结构

```
~/.claude/jobs/<jobId>/
├── state.json      # Job 状态
├── template.md     # Job 模板
├── input.txt       # 输入内容
└── replies.jsonl   # 回复追加日志
```

## 依赖关系

- 依赖：`utils/envUtils`（获取 `CLAUDE_JOB_DIR`）、`types/message`
- `classifier.ts` 被 `stopHooks.ts` 在主线程每轮结束时调用
- `state.ts` 被 job 相关 CLI 命令和 hooks 使用
