# AI HOT P0 信源接入说明

## 目标

把 `https://aihot.virxact.com/` 作为 `zoed.signal` 的 P0 临时试运行信息源接入。

当前策略不是前台现查现用，而是：

`AI HOT -> 你的适配层 -> 标准化 -> 最小筛选 -> 写入你自己的库 -> 前台展示`

## 当前已接入的能力

### 1. 预览候选内容

接口：

```text
GET /api/sources/aihot/items?mode=selected&since=3
```

作用：

- 从 AI HOT 拉取候选内容
- 做最小字段映射
- 返回预览结果，不入库

### 2. 导入到你的库

接口：

```text
POST /api/sources/aihot/import?mode=selected&since=3
```

作用：

- 从 AI HOT 拉取内容
- 做最小去重
- 映射到现有 `news_items` 结构
- 自动挂到当天的 `AI HOT` brief 下

## 当前 P0 规则

### 查询思路

- `mode=selected`：优先拉精选池
- `mode=all`：需要时拉全量池
- `since=3`：默认最近 3 天

### 去重方式

- 先按 `sourceUrl` 去重
- 写入时使用基于 `sourceUrl` 生成的稳定 `id`

### 第二层筛选

- `published`：适合公开展示给用户
- `candidate`：先作为候选内容存着，不出现在公开页面

当前规则：

- 手动录入内容默认 `published`
- AI HOT 导入内容会根据来源、类别、是否来自精选池做一次最小判断

### 存储方式

- 不直接展示外部 API 返回
- 先写入你自己的 `briefs` 和 `news_items`

### 当前输出结构

P0 先按现有字段结构落库，并主要服务这 4 层：

1. 原始事件
2. 核心摘要
3. 商业解读
4. 对用户的价值

## 数据库补充

这次新增了 `curation_stage` 字段，用来区分：

- `candidate`
- `published`

如果你正在使用 Supabase，需要执行：

```text
supabase/add-curation-stage.sql
```

## 后台入口

后台页面已增加 `AI HOT P0 Source` 面板。

你可以：

1. 先预览数量
2. 再导入到自己的库

## 这版刻意没做的事

1. 没接多信源调度
2. 没做复杂审核台
3. 没做深度 AI 二次总结链路
4. 没做自动定时任务

## 下一步最适合做什么

1. 继续细化 AI HOT 到你自己字段的映射规则
2. 增加更明确的内容筛选规则
3. 增加“是否进入简报”的二次分层
4. 再接第二个正式信源，而不是一开始做爬虫大全
