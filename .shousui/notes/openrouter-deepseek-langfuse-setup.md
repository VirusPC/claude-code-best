# OpenRouter + DeepSeek + Langfuse 配置笔记

## 最终配置（~/.claude/settings.json）

```json
{
  "env": {
    "CLAUDE_CODE_USE_OPENAI": "1",
    "OPENAI_BASE_URL": "https://openrouter.ai/api/v1",
    "OPENAI_API_KEY": "sk-or-v1-...",
    "OPENAI_MODEL": "deepseek/deepseek-v4-pro",
    "LANGFUSE_PUBLIC_KEY": "pk-lf-...",
    "LANGFUSE_SECRET_KEY": "sk-lf-...",
    "LANGFUSE_BASE_URL": "https://us.cloud.langfuse.com"
  },
  "modelType": "openai"
}
```

## 踩坑记录

### 1. 模型 ID 格式：点 vs 横线
- ❌ `anthropic/claude-haiku-4.5` → 404 Not Found
- ✅ `anthropic/claude-haiku-4-5` → OpenRouter 要求用横线

### 2. Anthropic 兼容模式下 baseURL 重复 /v1
- Anthropic SDK 请求路径是 `/v1/messages`，会拼在 baseURL 后面
- ❌ `ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1` → 实际请求 `/api/v1/v1/messages`
- ✅ `ANTHROPIC_BASE_URL=https://openrouter.ai/api` → 实际请求 `/api/v1/messages`
- 但 OpenRouter 根本不支持 Anthropic 消息格式，所以这条路最终放弃

### 3. Anthropic 模型区域封锁（403）
- OpenRouter 上的 `anthropic/claude-*` 系列在国内被封锁
- 报错：`{"error":{"message":"This model is not available in your region.","code":403}}`
- 解决：换用 DeepSeek 模型

### 4. DeepSeek context 超限（400）
- `deepseek/deepseek-chat` 在 OpenRouter 上被限制为 32K context
- 该项目系统提示词（60+ 工具定义 + CLAUDE.md）光 prompt 就 36K token，超限
- 解决：换用 `deepseek/deepseek-v4-pro`（context 更大）

### 5. 为什么用 OpenAI 兼容模式而不是 Anthropic 兼容模式
- OpenRouter 的主接口是 OpenAI Chat Completions（`POST /v1/chat/completions`）
- OpenRouter 没有 Anthropic 消息格式（`/v1/messages`）的兼容端点
- 本项目支持 `CLAUDE_CODE_USE_OPENAI=1` 切换到 OpenAI 兼容路径

## Langfuse 接入原理

- 使用 OpenTelemetry 方案（`@langfuse/otel` + `@langfuse/tracing`）
- 每次 LLM 调用通过 `recordLLMObservation()` 上报，包含 model、messages、tools、usage、耗时
- 启用条件：同时设置 `LANGFUSE_PUBLIC_KEY` 和 `LANGFUSE_SECRET_KEY`
- Key 获取：cloud.langfuse.com → 创建 Project → Settings → API Keys
- 自托管：把 `LANGFUSE_BASE_URL` 改成自己的域名
