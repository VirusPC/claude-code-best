# `src/moreright` — MoreRight 功能 Hook（Stub）

内部专有 "MoreRight" 功能 hook 的对外 stub 占位，真实实现为内部代码。

## 主要文件

| 文件 | 职责 |
|------|------|
| `useMoreRight.tsx` | 空实现 stub，返回三个 no-op 回调 |

## 导出接口

```ts
useMoreRight() => {
  onBeforeQuery: () => true,   // 查询前调用，始终放行
  onTurnComplete: () => void,  // 每轮完成后调用，no-op
  render: () => null,          // UI 渲染，返回 null
}
```

## 说明

注释明确 "no relative imports"，避免外部构建中找不到内部路径。内部构建版本会注入真实的 "MoreRight" 行为，被 REPL 主组件在每轮提交前后调用。
