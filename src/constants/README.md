# `src/constants` — 全局常量

集中存放所有跨模块共享的只读常量，不含业务逻辑。

## 主要文件

| 文件 | 内容 |
|------|------|
| `product.ts` | 产品 URL、环境检测（`CLAUDE_AI_BASE_URL`、`getRemoteSessionUrl`、`isAntEmployee` 等） |
| `system.ts` / `systemPromptSections.ts` | 系统提示核心内容与片段常量 |
| `betas.ts` | API beta 标志列表 |
| `apiLimits.ts` | API 速率/大小限制值 |
| `toolLimits.ts` | 工具调用限制值 |
| `tools.ts` | `CORE_TOOLS` 白名单（38 个核心工具名） |
| `oauth.ts` | OAuth 端点常量 |
| `outputStyles.ts` | 输出样式枚举 |
| `errorIds.ts` | 错误 ID 常量 |
| `keys.ts` | 键盘按键常量 |
| `messages.ts` | 消息模板常量 |
| `xml.ts` | XML 标签名常量 |
| `figures.ts` | Unicode 图形字符 |
| `spinnerVerbs.ts` | Spinner 动词列表 |
| `common.ts` | 日期格式化工具（`getLocalISODate`/`getSessionStartDate`） |

## 设计原则

- 设计为 DAG **叶节点**，几乎不依赖其他内部模块
- 被绝大多数业务模块引用
