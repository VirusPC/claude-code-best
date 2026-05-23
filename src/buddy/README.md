# `src/buddy` — Companion/Buddy 游戏化功能

实现虚拟伴侣（类似宠物）游戏化功能，通过确定性随机算法生成独特的伴侣角色并渲染精灵动画。

## 主要文件

| 文件 | 职责 |
|------|------|
| `companion.ts` | 核心逻辑：`roll()` 用 Mulberry32 PRNG 根据 userId 生成伴侣骨骼数据；`getCompanion()` 合并存储的 soul 与重新生成的 bones |
| `CompanionSprite.tsx` | 渲染精灵动画的 React 组件 |
| `CompanionCard.tsx` | 伴侣信息卡片 UI 组件 |
| `companionReact.ts` | React 层工具 |
| `prompt.ts` | 伴侣相关的提示词 |
| `sprites.ts` | 精灵图数据 |
| `types.ts` | 伴侣类型定义（物种、稀有度、外观属性） |
| `useBuddyNotification.tsx` | 通知提示 hook |

## 伴侣属性

- 物种、稀有度（基于 userId 的确定性随机）
- 外观属性：眼睛、帽子
- 能力数值

## 依赖关系

- 依赖：`utils/config.js`（读取全局配置中的 oauthAccount/companion 字段）
- 被消费：UI 组件层（`components/`）展示
