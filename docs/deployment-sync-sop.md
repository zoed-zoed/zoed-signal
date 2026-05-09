# zoed.signal 发布与三方同步 SOP

这份文档是给现在的你用的。

你不用懂很多编程概念，只要记住一件事：

**每次上线，本质上是在让 3 个地方保持同一版本：**

- `GitHub`：代码仓库，存“你现在做的产品代码”
- `Vercel`：线上网站，存“用户现在能看到的版本”
- `Supabase`：数据库，存“网站读取的数据和表结构”

如果这三边不同步，就会出现这些问题：

- 本地改了，线上没变
- 网站上线了，但数据库字段没跟上，直接报错
- Supabase 数据已经改了，但 GitHub 里没有记录，后面自己都忘了为什么这么改

所以以后每次上线，都按下面这套清单来。

---

## A. 超短上线清单

每次上线前，按这 8 步做：

### 1. 在本地改完代码
- 确保你这次要上线的页面、功能都已经在本地做好

### 2. 如果改了数据库，先准备 SQL 文件
- 去看 `supabase/` 目录
- 把这次新增字段、policy、表结构变化写成一个新的 `.sql` 文件

### 3. 本地先自检
在项目根目录运行：

```powershell
npm run lint
npm run build
```

只要有报错，就先不要上线。

### 4. 如果这次有数据库变更，去 Supabase 执行 SQL
- 打开 Supabase
- 进入 `SQL Editor`
- 复制你这次的 SQL 文件内容
- 运行

### 5. 提交到 GitHub

```powershell
git status
git add .
git commit -m "写一句这次改了什么"
git push origin main
```

### 6. 等 Vercel 自动部署
- 打开 Vercel
- 找到这个项目最新 deployment
- 等状态变成 `Ready`

### 7. 打开线上网址检查
- 首页
- `/admin`
- `/library`
- 这次你改到的页面

### 8. 记一条结果
- 这次上线是否成功
- 是否改了数据库
- 是否需要补充说明

---

## B. 详细 SOP

下面是你以后每次都可以照着走的详细版本。

---

### 第 0 步：先理解这次改动属于哪一类

上线前先问自己：

### 类型 1：只改页面/文案/样式
比如：
- 首页文案
- 卡片位置
- 后台布局

这种通常只需要：
- 本地检查
- push 到 GitHub
- 等 Vercel 自动部署

### 类型 2：改功能逻辑
比如：
- AI HOT 导入逻辑
- 筛选逻辑
- 新增接口

这种需要：
- 本地检查
- push 到 GitHub
- 上线后重点测功能流程

### 类型 3：改数据库结构
比如：
- 新增字段
- 新增表
- 新增 RLS policy
- 修改字段类型

这种最容易出问题，因为它要求：

**代码和 Supabase 必须一起升级。**

---

### 第 1 步：先在本地确认代码是你想上线的版本

在项目根目录：

```powershell
cd D:\AI_Projects\zoed-signal
git status
```

你要看什么：

- 如果看到很多 `modified`
  说明你本地还有没提交的改动
- 如果你本来就还在开发，这是正常的
- 关键是：你要知道这些改动是不是都准备上线

如果你想看自己改了哪些文件：

```powershell
git status --short
```

---

### 第 2 步：如果改了数据库，先写 SQL 文件

所有数据库变更，都先在项目里留文件。

位置：

```text
supabase/
```

举例：

- `supabase/add-curation-stage.sql`

你要做的不是“直接去 Supabase 点一通”，而是：

1. 先在项目里写 SQL 文件
2. 再把同样内容贴到 Supabase 运行

这样以后你才能知道：

- 这个字段什么时候加的
- 为什么加
- 线上数据库和代码有没有对应关系

---

### 第 3 步：本地先跑检查

在项目根目录运行：

```powershell
npm run lint
npm run build
```

你怎么理解这两个命令：

- `npm run lint`
  像“语法和规范检查”
- `npm run build`
  像“模拟正式上线打包”

只要这里报错，就先不要上线。

因为如果本地 build 都过不了，Vercel 大概率也会失败。

---

### 第 4 步：如果改了数据库，去 Supabase 执行 SQL

操作位置：

1. 打开 [Supabase](https://supabase.com/)
2. 进入你的项目
3. 点击左侧 `SQL Editor`
4. 新建一个 query
5. 把你项目里刚写的 SQL 文件内容复制进去
6. 点击运行

跑完以后，最好再做一次人工确认。

比如如果你新增了字段：

- 去 `Table Editor`
- 打开对应表
- 看字段是不是已经真的出现了

比如如果你新增了 policy：

- 去 `Authentication` 或表的 policy 位置
- 看 policy 是否已经存在

---

### 第 5 步：提交到 GitHub

这一步的意义是：

**让 GitHub 成为这次版本的正式记录。**

命令：

```powershell
git add .
git commit -m "feat: 写这次改动"
git push origin main
```

常见 commit message 写法：

- `feat: add aihot source import`
- `fix: repair supabase homepage check`
- `docs: add deployment sync sop`

如果你想先看看现在 GitHub 会收到什么：

```powershell
git status
```

如果你想确认是否已经 push 成功：

```powershell
git status
```

看到类似下面这种，通常就是干净的：

```text
nothing to commit, working tree clean
```

---

### 第 6 步：等 Vercel 自动部署

你的项目现在是 GitHub 推动 Vercel 更新。

也就是说：

**只要 `main` 分支 push 成功，Vercel 通常就会自动开始部署。**

你要去哪里看：

1. 打开 [Vercel](https://vercel.com/)
2. 找到你的项目 `zoed-signal`
3. 进入 `Deployments`
4. 看最新一条 deployment

你要看什么状态：

- `Building`：正在部署
- `Ready`：部署成功
- `Error`：部署失败

只有 `Ready` 才算线上更新完成。

---

### 第 7 步：打开线上网址人工验收

网址：

[https://zoed-signal.vercel.app/](https://zoed-signal.vercel.app/)

不要只看首页。

每次至少检查这几处：

### 基础页
- 首页 `/`
- 后台 `/admin`
- 素材库 `/library`

### 你这次改动涉及的页
比如：
- 如果你改了 AI HOT 导入，就去后台看导入面板
- 如果你改了简报，就点进具体 brief 页面
- 如果你改了 Supabase 检查卡，就去 `/admin` 看卡片是否正常

### 检查时要看什么

不是只看“能打开”。

你要看：

- 页面是不是 500
- 文案是不是最新
- 新卡片/新按钮有没有出现
- 数据有没有读出来
- 这次新增功能是不是能走通

---

### 第 8 步：做一次“这轮上线是否完成”的判断

你可以问自己 4 个问题：

1. GitHub 上是不是已经有这次代码？
2. Vercel 最新 deployment 是不是 `Ready`？
3. 线上页面是不是已经变成最新版本？
4. 如果这次改了数据库，Supabase 是不是也补齐了？

只要有一个答案是否定的，就说明：

**这次还不能算真正同步完成。**

---

## C. 常见错误排查表

下面这些，是你最容易碰到的情况。

---

### 问题 1：本地是新的，线上还是旧的

### 现象
- 本地页面已经改了
- 打开线上网址还是旧版

### 最常见原因
- 你还没 `git push`
- push 了，但 Vercel 还没部署完
- Vercel 部署失败

### 你该怎么查

先运行：

```powershell
git status
```

如果还有未提交改动，说明 GitHub 还没收到这版。

再去 Vercel 看：

- 最新 deployment 是不是 `Ready`

---

### 问题 2：Vercel 上线后页面 500

### 现象
- 网址能打开
- 但页面显示 500

### 最常见原因
- 代码开始读取一个新字段
- 但 Supabase 里还没有这个字段

这就是典型的：

**代码更新了，数据库没更新。**

### 你该怎么查

先回想：

- 这次有没有新增字段？
- 有没有新增 policy？
- 有没有新增表？

如果有，就去看：

- 这条 SQL 有没有在 Supabase 真跑过

---

### 问题 3：前端读不到 Supabase 数据

### 现象
- 数据库里明明有数据
- 前端页面就是查不到

### 最常见原因
- RLS policy 没放行匿名只读
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 没配好

### 你该怎么查

先看：

- Supabase 里数据是否真的存在
- Vercel 环境变量是否已配置
- 后台的 `Supabase Check` 卡是否报 RLS 问题

---

### 问题 4：本地 build 能过，线上却报错

### 现象
- 本地 `npm run build` 成功
- Vercel 上线后还是有问题

### 最常见原因
- 本地用了 `.env.local`
- 但 Vercel 环境变量没同步

### 你该怎么查

去 Vercel：

1. 打开项目
2. 进入 `Settings`
3. 进入 `Environment Variables`
4. 检查你本地依赖的变量，线上是否也有

---

### 问题 5：Supabase 改过了，但项目里没记录

### 现象
- 数据库结构变了
- 但仓库里没有对应 SQL 文件

### 危险点
- 过几天你自己也忘了改了什么
- 以后换环境时无法重建

### 正确做法
- 补写 SQL 文件
- 放进 `supabase/`
- commit 到 GitHub

---

## D. 每次改数据库时必须记录的 SQL 文件规则

这部分很重要。

以后只要你动了 Supabase，就必须留 SQL 文件。

---

### 规则 1：先写文件，再去 Supabase 执行

不要先在网页上随手改，再回来想“要不要记一下”。

正确顺序是：

1. 在项目里写 SQL 文件
2. 再复制到 Supabase 执行

---

### 规则 2：所有 SQL 文件统一放在这里

```text
supabase/
```

---

### 规则 3：文件名要一眼看懂改了什么

推荐写法：

```text
add-xxx.sql
create-xxx.sql
update-xxx-policy.sql
enable-xxx-read.sql
```

例如：

- `add-curation-stage.sql`
- `enable-news-items-public-read.sql`
- `create-briefs-table.sql`

---

### 规则 4：一个文件只做一类改动

不要把很多无关的改动塞进一个 SQL 里。

好处是：

- 出问题更容易排查
- 以后更容易知道某次改动是做什么的

---

### 规则 5：SQL 文件头部最好写一句注释

例子：

```sql
-- Add curation_stage to news_items so we can split candidate vs published content.
alter table public.news_items
add column if not exists curation_stage text not null default 'published';
```

这样过几周再看，你还是知道这段 SQL 是干嘛的。

---

### 规则 6：改完数据库以后，要做双重确认

确认 1：Supabase 页面里真的改成功了

确认 2：项目代码也已经 commit 到 GitHub

只有这样才算“数据库变更被正式记录”。

---

## 最后给你的一个最简单原则

以后你每次上线，只要记住这句话就够了：

**先改代码，再补数据库，再 push GitHub，再看 Vercel，最后验收线上页面。**

如果你不按这个顺序走，就很容易出现：

- 本地新版，线上旧版
- 代码新版，数据库旧版
- 数据库已经变了，但仓库里没有记录

这就是你以后要尽量避免的事。
