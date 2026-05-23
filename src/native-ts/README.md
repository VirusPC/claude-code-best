# `src/native-ts` — 纯 TypeScript 原生模块实现

提供纯 TypeScript 实现的功能，作为 Rust NAPI 原生模块的替代，避免原生依赖。

## 主要文件

| 文件 | 职责 |
|------|------|
| `file-index/index.ts` | 高性能模糊文件搜索索引，是 `vendor/file-index-src`（基于 nucleo）的纯 TS 移植版 |

## `file-index` 特性

- 同步和异步两种索引构建方式
- 位图预过滤、top-k 堆优化
- 边界/驼峰评分（与 nucleo 行为对齐）
- API 与原生模块兼容

## 导出

```ts
class FileIndex {
  static loadFromFileList(files: string[]): FileIndex
  static loadFromFileListAsync(files: string[]): Promise<FileIndex>
  search(query: string, limit?: number): SearchResult[]
}
```

## 依赖关系

- 无外部依赖（纯计算代码）
- 被文件搜索功能调用，替代原生 `.node` 模块
