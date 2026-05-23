# `src/voice` — 语音模式功能开关

语音模式的功能开关（feature gate）判断层，决定是否启用语音输入功能。

## 主要文件

| 文件 | 职责 |
|------|------|
| `voiceModeEnabled.ts` | 唯一文件（62 行），集中所有语音功能开关判断逻辑 |

## 导出函数

| 函数 | 说明 |
|------|------|
| `isVoiceGrowthBookEnabled()` | 查询 GrowthBook kill-switch `tengu_amber_quartz_disabled`（fail-open） |
| `hasVoiceAuth()` | 检查用户是否有有效的 Anthropic OAuth token（voice_stream 端点仅支持 OAuth） |
| `isVoiceModeEnabled()` | 上述两者 AND |
| `isVoiceAvailable()` | 任意 STT 后端可用（含豆包等无需 Anthropic auth 的后端） |

## 模块分工

- 功能开关判断：`voice/voiceModeEnabled.ts`（本模块）
- 实际录音实现：`services/voice.ts`
- STT 实现：`services/voiceStreamSTT.ts`
- 豆包 STT：`services/doubaoSTT.ts`

## 依赖关系

- 依赖：`services/analytics/growthbook`（GrowthBook 特性标志）、`utils/auth`（OAuth token 检查）
- 被语音 UI 组件（命令注册、配置界面、录音触发）消费，以决定是否渲染/启用语音入口
