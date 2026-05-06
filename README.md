# zoed.signal

Less slop, more signal.

`zoed.signal` 是一个面向商科学生、非技术背景 AI 学习者和求职准备者的商业科技新闻工具。产品核心不是让模型编造新闻，而是：

`真实新闻源 -> 抓取原文与元信息 -> AI 整理 -> 结构校验 -> 写入 Supabase -> 前端展示`

## 产品原则

- 事实字段必须来自真实来源，而不是模型补写
- AI 只负责摘要、分类、标签、重要性判断和用户价值整理
- `title`、`sourceName`、`sourceUrl`、`publishedAt` 这类事实字段不能由模型自由编造
- Supabase 是正式环境的主数据源
- 本地 JSON 只用于开发测试和 demo，不参与正式新闻流兜底

## 当前能力

- 首页展示简报归档
- 简报详情页展示新闻卡片
- 素材库展示收藏内容
- 后台新增 / 编辑简报
- 后台新增 / 编辑新闻
- Supabase 持久化
- 开发环境可显式启用本地 mock 数据

## 启动开发环境

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 环境变量

复制 `.env.example` 为 `.env.local`，再填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ZOED_ALLOW_LOCAL_DATA=false
```

说明：

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 项目地址
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 预留给后续客户端能力
- `SUPABASE_SERVICE_ROLE_KEY`: 当前服务端读写真实数据使用的 key
- `ZOED_ALLOW_LOCAL_DATA`: 仅开发调试时可设为 `true`，允许使用 `data/*.json` mock 数据

## 数据源策略

### 正式环境

- 必须使用 Supabase
- 如果 Supabase 读取失败，页面显示错误提示 / 重试，不自动混入本地 demo 数据
- 如果 Supabase 写入失败，接口直接报错，不回退写本地 JSON

### 开发环境

开发时有两种模式：

1. Supabase 模式
   - 配好 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`
   - 直接读写 Supabase

2. 本地 mock 模式
   - 不配 Supabase
   - 且显式设置 `ZOED_ALLOW_LOCAL_DATA=true`
   - 此时才会读写 `data/briefs.json`、`data/news.json`、`data/bookmarks.json`

## Supabase 接入

### 1. 建表

在 Supabase SQL Editor 里执行：

```text
supabase/schema.sql
```

### 2. 从本地 mock 数据同步到 Supabase

仅开发阶段有历史 JSON 数据需要迁移时使用：

```bash
node scripts/sync-json-to-supabase.mjs
```

### 3. 配置部署环境变量

在 Vercel 项目设置里配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

不要在正式环境开启 `ZOED_ALLOW_LOCAL_DATA=true`。

## 为什么现在使用 service role key

当前版本还没有接入完整的用户登录与权限系统，所以服务端统一负责读写真实内容，再由服务端安全地使用 `SUPABASE_SERVICE_ROLE_KEY`。

后续接入 Supabase Auth 后，再逐步补齐：

- 用户级权限
- RLS 策略
- 用户自己的收藏偏好

## 相关文档

- [数据写入与前台展示闭环](./docs/data-write-and-display-closure.md)
- [AI 内容处理流程](./docs/ai-content-processing-pipeline.md)
- [Supabase 数据架构](./docs/supabase-data-architecture.md)
