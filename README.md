# zoed.signal

Less slop, more signal.

`zoed.signal` 是一个面向商科学生、非技术背景 AI 学习者和求职准备者的商业科技简报工具。当前版本支持：

- 首页浏览简报归档
- 后台新增 / 编辑简报
- 后台新增 / 编辑新闻卡片
- 将新闻收藏到素材库
- 本地 JSON 持久化
- Supabase 数据层接入（已支持，未配置时自动回退到 JSON）

## 本地启动

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 当前数据模式

现在项目支持两种数据来源：

1. **默认模式：本地 JSON**
   - 数据文件在 `data/briefs.json`
   - 数据文件在 `data/news.json`
   - 数据文件在 `data/bookmarks.json`

2. **Supabase 模式**
   - 当你配置好 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 后
   - 项目会自动优先使用 Supabase
   - 如果没配完整，会自动继续使用本地 JSON，不会把现有站点弄坏

## 接入 Supabase

### 1. 创建本地环境变量

复制一份 `.env.example`，新建为 `.env.local`，然后填入：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

说明：

- `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目地址
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`：先为后续 Auth / 客户端能力预留
- `SUPABASE_SERVICE_ROLE_KEY`：当前这版服务端读写真正使用的密钥，只能放在服务端环境变量里，不能提交到 GitHub

### 2. 建表

在 Supabase 的 SQL Editor 里执行：

```text
supabase/schema.sql
```

### 3. 把现有 JSON 数据同步到 Supabase

```bash
node scripts/sync-json-to-supabase.mjs
```

同步成功后会输出：

```json
{
  "syncedBriefs": 0,
  "syncedNewsItems": 0,
  "syncedBookmarks": 0
}
```

### 4. 配置 Vercel 环境变量

把下面三个变量也加到 Vercel 项目设置里：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

加完后重新部署，线上站点就会开始使用 Supabase。

## 为什么现在用 service role key

因为当前版本还没有登录系统，后台是“你自己维护内容”的模式。  
为了避免把数据库直接暴露给匿名客户端，这一版的数据库读写统一走服务器端，再由服务器端使用 `SUPABASE_SERVICE_ROLE_KEY`。

等后面接入 Supabase Auth 后，我们再把用户级权限、RLS 策略和真正的多用户收藏偏好补齐。
