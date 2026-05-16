import { createHash } from "node:crypto";

import { getBriefById, saveBrief } from "@/lib/data/briefs";
import { getNewsItems, saveNewsItem } from "@/lib/data/news";
import {
  createSourceImportRun,
  ensureSourceFeed,
  finalizeSourceImportRun,
  saveSourceItemRawRecords,
} from "@/lib/data/source-imports";
import { NEWS_CATEGORY_OPTIONS, type Importance, type NewsCategory, type NewsItem } from "@/types/news";

const AIHOT_BASE_URL = "https://aihot.virxact.com";
const AIHOT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36";

const SHANGHAI_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type AiHotMode = "selected" | "all";

type AiHotItem = {
  id: string;
  title: string;
  title_en: string | null;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  category: string;
};

type AiHotItemsResponse = {
  count: number;
  hasNext: boolean;
  nextCursor: string | null;
  items: AiHotItem[];
};

export type AiHotQuery = {
  mode?: AiHotMode;
  since?: number;
  q?: string;
  category?: string;
  cursor?: string;
};

export type AiHotPreviewItem = {
  externalId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  summary: string;
  externalCategory: string;
  mappedCategory: NewsCategory;
  mappedImportance: Importance;
};

export type AiHotImportResult = {
  runId?: number;
  briefId: string;
  briefTitle: string;
  fetchedCount: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  mode: AiHotMode;
  since: number;
  items: AiHotPreviewItem[];
  warnings?: string[];
};

export async function fetchAiHotPreview(query: AiHotQuery = {}): Promise<AiHotPreviewItem[]> {
  const response = await fetchAiHotItems(query);
  return dedupeAiHotItems(response.items).map((item) => toPreviewItem(item, query.mode ?? "selected"));
}

export async function importAiHotItems(query: AiHotQuery = {}): Promise<AiHotImportResult> {
  const mode = query.mode ?? "selected";
  const since = clampSince(query.since);
  const warnings: string[] = [];
  let runId: number | undefined;

  try {
    await ensureSourceFeed({
      id: "aihot",
      name: "AI HOT",
      sourceType: "api",
      baseUrl: AIHOT_BASE_URL,
      notes: "AI HOT public items API used as the first external content source for zoed.signal.",
    });
    const run = await createSourceImportRun({
      feedId: "aihot",
      triggerType: "manual",
      notes: `mode=${mode}; since=${since}`,
    });
    runId = run.id;
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Failed to initialize source import tracing.");
  }

  const response = await fetchAiHotItems({ ...query, mode, since });
  const dedupedItems = dedupeAiHotItems(response.items);
  const duplicateCount = response.items.length - dedupedItems.length;

  const briefDate = getShanghaiToday();
  const briefId = `aihot-${briefDate}`;
  const briefTitle = `AI HOT 每日简报 · ${briefDate}`;
  const existingBrief = await getBriefById(briefId);
  const existingItems = await getNewsItems();
  const existingByUrl = new Map(existingItems.map((item) => [normalizeUrl(item.sourceUrl), item]));

  const baseBrief = {
    id: briefId,
    title: existingBrief?.title ?? briefTitle,
    date: existingBrief?.date ?? briefDate,
    intro:
      existingBrief?.intro ??
      "从 AI HOT 导入并筛选的当日科技商业信号，聚焦值得继续跟进的 AI、市场与公司动态。",
    tags: Array.from(new Set([...(existingBrief?.tags ?? []), "AI HOT", mode === "selected" ? "精选池" : "全量池"])),
    coreTrend: existingBrief?.coreTrend,
    studentInsight: existingBrief?.studentInsight,
    contentIdeas: existingBrief?.contentIdeas,
    resumePortfolioNote: existingBrief?.resumePortfolioNote,
    newsItemIds: existingBrief?.newsItemIds ?? [],
  };

  await saveBrief(baseBrief);

  const imported: NewsItem[] = [];
  const rawRecords: Parameters<typeof saveSourceItemRawRecords>[0] = [];
  let failedCount = 0;
  const seenUrls = new Set<string>();

  for (const item of response.items) {
    const normalizedUrl = normalizeUrl(item.url);
    const normalizedSummary = normalizeSentence(item.summary || item.title, 600);

    if (!item.url || !item.title || !item.publishedAt) {
      failedCount += 1;
      rawRecords.push({
        runId: runId ?? null,
        feedId: "aihot",
        externalId: item.id,
        sourceUrl: item.url,
        title: item.title,
        publishedAt: item.publishedAt,
        rawPayload: item as unknown as Record<string, unknown>,
        normalizedSummary,
        dedupeKey: normalizedUrl || null,
        processingStatus: "failed",
      });
      continue;
    }

    if (seenUrls.has(normalizedUrl)) {
      rawRecords.push({
        runId: runId ?? null,
        feedId: "aihot",
        externalId: item.id,
        sourceUrl: item.url,
        title: item.title,
        publishedAt: item.publishedAt,
        rawPayload: item as unknown as Record<string, unknown>,
        normalizedSummary,
        dedupeKey: normalizedUrl,
        processingStatus: "duplicate",
      });
      continue;
    }

    seenUrls.add(normalizedUrl);

    try {
      const existing = existingByUrl.get(normalizedUrl);
      const mapped = mapAiHotItemToNewsItem(item, {
        briefId,
        mode,
        existingItem: existing,
      });
      await saveNewsItem(mapped);
      imported.push(mapped);
      rawRecords.push({
        runId: runId ?? null,
        feedId: "aihot",
        externalId: item.id,
        sourceUrl: item.url,
        title: item.title,
        publishedAt: item.publishedAt,
        rawPayload: item as unknown as Record<string, unknown>,
        normalizedSummary,
        dedupeKey: normalizedUrl,
        processingStatus: "imported",
        mappedNewsItemId: mapped.id,
      });
    } catch (error) {
      failedCount += 1;
      warnings.push(
        error instanceof Error ? `Failed to import "${item.title}": ${error.message}` : `Failed to import "${item.title}".`,
      );
      rawRecords.push({
        runId: runId ?? null,
        feedId: "aihot",
        externalId: item.id,
        sourceUrl: item.url,
        title: item.title,
        publishedAt: item.publishedAt,
        rawPayload: item as unknown as Record<string, unknown>,
        normalizedSummary,
        dedupeKey: normalizedUrl,
        processingStatus: "failed",
      });
    }
  }

  try {
    await saveSourceItemRawRecords(rawRecords);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Failed to save raw source item records.");
  }

  const mergedNewsItemIds = Array.from(new Set([...(existingBrief?.newsItemIds ?? []), ...imported.map((item) => item.id)]));

  await saveBrief({
    ...baseBrief,
    coreTrend: existingBrief?.coreTrend ?? summarizeCategories(imported),
    studentInsight:
      existingBrief?.studentInsight ??
      "重点不是记住新闻本身，而是把每天的 AI 变化转成你对市场、岗位和公司动作的判断。",
    contentIdeas:
      existingBrief?.contentIdeas ??
      "优先挑出最适合继续延展的方向：产品路线、商业化、招聘信号和可以拿来做案例拆解的公司动作。",
    resumePortfolioNote:
      existingBrief?.resumePortfolioNote ??
      "本期内容适合继续沉淀成面试表达、商赛案例卡片，或你自己的行业观察素材。",
    newsItemIds: mergedNewsItemIds,
  });

  const skippedCount = duplicateCount;

  if (runId) {
    try {
      await finalizeSourceImportRun(runId, {
        runStatus: failedCount > 0 && imported.length === 0 ? "failed" : "success",
        fetchedCount: response.items.length,
        importedCount: imported.length,
        skippedCount,
        failedCount,
        notes: [
          `mode=${mode}`,
          `since=${since}`,
          duplicateCount > 0 ? `duplicates_in_batch=${duplicateCount}` : "",
          warnings.length ? `warnings=${warnings.length}` : "",
        ]
          .filter(Boolean)
          .join("; "),
      });
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "Failed to finalize source import run.");
    }
  }

  return {
    runId,
    briefId,
    briefTitle: baseBrief.title,
    fetchedCount: response.items.length,
    importedCount: imported.length,
    skippedCount,
    failedCount,
    mode,
    since,
    items: dedupedItems.map((item) => toPreviewItem(item, mode)),
    warnings: warnings.length ? warnings : undefined,
  };
}

async function fetchAiHotItems(query: AiHotQuery): Promise<AiHotItemsResponse> {
  const url = new URL("/api/public/items", AIHOT_BASE_URL);
  url.searchParams.set("mode", query.mode ?? "selected");
  url.searchParams.set("since", String(clampSince(query.since)));

  if (query.q?.trim()) {
    url.searchParams.set("q", query.q.trim());
  }

  if (query.category?.trim()) {
    url.searchParams.set("category", query.category.trim());
  }

  if (query.cursor?.trim()) {
    url.searchParams.set("cursor", query.cursor.trim());
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": AIHOT_USER_AGENT,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch AI HOT items: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as AiHotItemsResponse;
  if (!Array.isArray(data.items)) {
    throw new Error("AI HOT response is missing items array.");
  }

  return data;
}

function dedupeAiHotItems(items: AiHotItem[]): AiHotItem[] {
  const byUrl = new Map<string, AiHotItem>();

  for (const item of items) {
    if (!item.url || !item.title || !item.publishedAt) {
      continue;
    }

    const key = normalizeUrl(item.url);
    if (!byUrl.has(key)) {
      byUrl.set(key, item);
    }
  }

  return Array.from(byUrl.values());
}

function toPreviewItem(item: AiHotItem, mode: AiHotMode): AiHotPreviewItem {
  return {
    externalId: item.id,
    title: item.title.trim(),
    sourceName: item.source.trim(),
    sourceUrl: item.url,
    publishedAt: toDateOnly(item.publishedAt),
    summary: normalizeSentence(item.summary || item.title, 600),
    externalCategory: item.category,
    mappedCategory: mapAiHotCategory(item),
    mappedImportance: mode === "selected" ? IMPORTANCE_OPTIONS.mustRead : IMPORTANCE_OPTIONS.scan,
  };
}

const IMPORTANCE_OPTIONS = {
  mustRead: "必看" as Importance,
  scan: "可扫" as Importance,
};

function mapAiHotItemToNewsItem(
  item: AiHotItem,
  options: {
    briefId: string;
    mode: AiHotMode;
    existingItem?: NewsItem;
  },
): NewsItem {
  const summary = normalizeSentence(item.summary || item.title, 600);
  const mappedCategory = mapAiHotCategory(item);
  const sourceName = item.source.trim();

  return {
    id: options.existingItem?.id ?? buildStableNewsId(item.url),
    briefId: options.briefId,
    title: item.title.trim(),
    sourceName,
    sourceUrl: item.url,
    publishedAt: toDateOnly(item.publishedAt),
    category: mappedCategory,
    importance: options.mode === "selected" ? IMPORTANCE_OPTIONS.mustRead : IMPORTANCE_OPTIONS.scan,
    whatHappened: summary,
    whyImportant: buildWhyImportant(mappedCategory, sourceName),
    relevanceToBusinessStudents: buildStudentValue(mappedCategory),
    interviewOrCaseUse: buildInterviewUse(mappedCategory),
    nextAction:
      options.existingItem?.nextAction ??
      "Reserved internal field for later action suggestions. Not shown on the public frontend in P0.",
    tags: buildTags(item, mappedCategory, sourceName),
    savedType: options.existingItem?.savedType ?? [],
    curationStage: options.existingItem?.curationStage ?? assessCurationStage(item, mappedCategory, options.mode),
  };
}

function mapAiHotCategory(item: AiHotItem): NewsCategory {
  const title = `${item.title} ${item.summary}`.toLowerCase();
  const source = item.source.toLowerCase();

  if (hasAny(title, ["funding", "acquisition", "m&a", "ipo", "融资", "收购", "并购"])) {
    return NEWS_CATEGORY_OPTIONS[2];
  }

  if (hasAny(title, ["policy", "regulation", "compliance", "copyright", "监管", "政策", "合规"])) {
    return NEWS_CATEGORY_OPTIONS[3];
  }

  if (hasAny(title, ["job", "hiring", "intern", "recruit", "招聘", "实习", "岗位"])) {
    return NEWS_CATEGORY_OPTIONS[5];
  }

  if (hasAny(title, ["chip", "gpu", "inference", "hardware", "cuda", "算力", "芯片"])) {
    return NEWS_CATEGORY_OPTIONS[4];
  }

  if (item.category === "ai-products" || item.category === "ai-models") {
    return NEWS_CATEGORY_OPTIONS[0];
  }

  if (item.category === "tip") {
    return hasAny(title, ["agent", "workflow", "case", "案例"]) ? NEWS_CATEGORY_OPTIONS[6] : NEWS_CATEGORY_OPTIONS[0];
  }

  if (hasAny(source, ["openai", "anthropic", "google", "microsoft", "meta"])) {
    return NEWS_CATEGORY_OPTIONS[1];
  }

  return NEWS_CATEGORY_OPTIONS[1];
}

function buildWhyImportant(category: NewsCategory, sourceName: string): string {
  switch (category) {
    case NEWS_CATEGORY_OPTIONS[0]:
      return `${sourceName} 这次动作对应的是具体产品或模型能力变化，能帮助你判断 AI 产品真正往哪里走。`;
    case NEWS_CATEGORY_OPTIONS[1]:
      return "这是偏公司战略层的信号，适合用来判断资源投入、竞争焦点和业务方向是否在变化。";
    case NEWS_CATEGORY_OPTIONS[2]:
      return "这类信息直接关系到商业模式、融资或市场扩张，比单纯的产品噪音更值得优先跟进。";
    case NEWS_CATEGORY_OPTIONS[3]:
      return "政策与合规会直接影响产品边界和落地节奏，所以它本身就是商业判断的一部分。";
    case NEWS_CATEGORY_OPTIONS[4]:
      return "AI 产品能不能规模化，最终都会回到算力和基础设施，因此硬件信号不能忽略。";
    case NEWS_CATEGORY_OPTIONS[5]:
      return "招聘信号最能反映公司现在到底需要什么能力、什么工作流，而不只是口头上的趋势判断。";
    case NEWS_CATEGORY_OPTIONS[6]:
      return "这类内容很适合沉淀成案例素材，后续可以直接转成面试表达、商赛分析或市场观察。";
    default:
      return "它能帮助你把 AI 新闻翻译成更清晰的商业判断和职业判断。";
  }
}

function buildStudentValue(category: NewsCategory): string {
  switch (category) {
    case NEWS_CATEGORY_OPTIONS[0]:
      return "适合用来理解产品路线、功能优先级，以及哪些用户需求正在从概念走向真实市场。";
    case NEWS_CATEGORY_OPTIONS[1]:
      return "适合训练战略判断，而不只是记住模型名字或热点周期。";
    case NEWS_CATEGORY_OPTIONS[2]:
      return "适合帮助你理解 AI 公司怎么赚钱，以及市场如何评估增长和扩张。";
    case NEWS_CATEGORY_OPTIONS[3]:
      return "适合建立对产品风险、合规要求和平台治理更成熟的判断。";
    case NEWS_CATEGORY_OPTIONS[4]:
      return "适合理解为什么成本结构和基础设施，会决定 AI 产品到底能不能真正规模化。";
    case NEWS_CATEGORY_OPTIONS[5]:
      return "对求职很有用，因为它展示的是公司真实在招什么，而不是网上泛泛讨论什么。";
    case NEWS_CATEGORY_OPTIONS[6]:
      return "适合拿来做面试素材、写作选题或商赛案例，因为它本身就容易转成清晰观点。";
    default:
      return "适合把 AI 新闻转化成你对商业、市场和职业路径的长期理解。";
  }
}

function buildInterviewUse(category: NewsCategory): string {
  switch (category) {
    case NEWS_CATEGORY_OPTIONS[0]:
      return "可以拿它说明你如何判断一次产品更新到底有没有战略意义，而不是只会复述“出了新功能”。";
    case NEWS_CATEGORY_OPTIONS[1]:
      return "可以把它当成公司战略案例，用来谈平台动作、资源配置或竞争格局。";
    case NEWS_CATEGORY_OPTIONS[2]:
      return "可以用在 AI 商业化、定价、融资逻辑和市场扩张相关的问题里。";
    case NEWS_CATEGORY_OPTIONS[3]:
      return "适合放在“产品创新和合规限制如何平衡”这类表达里。";
    case NEWS_CATEGORY_OPTIONS[4]:
      return "可以借它体现你知道 AI 落地不仅是模型问题，也是基础设施和成本问题。";
    case NEWS_CATEGORY_OPTIONS[5]:
      return "可以用来具体谈岗位要求、团队工作流，以及 AI 应用岗位到底在做什么。";
    case NEWS_CATEGORY_OPTIONS[6]:
      return "可以直接拿去当面试案例、商赛材料或书面分析的支撑。";
    default:
      return "可以用它证明你能把日常 AI 新闻转成结构化的商业判断，而不是只会刷资讯。";
  }
}

function buildTags(item: AiHotItem, category: NewsCategory, sourceName: string): string[] {
  const tags = new Set<string>(["AI HOT", category]);

  if (sourceName.toLowerCase().includes("openai")) tags.add("OpenAI");
  if (sourceName.toLowerCase().includes("anthropic")) tags.add("Anthropic");
  if (sourceName.toLowerCase().includes("google")) tags.add("Google");
  if (sourceName.toLowerCase().includes("microsoft")) tags.add("Microsoft");
  if (sourceName.toLowerCase().includes("meta")) tags.add("Meta");
  if (hasAny(item.title.toLowerCase(), ["agent"])) tags.add("Agent");
  if (hasAny(item.title.toLowerCase(), ["hiring", "intern", "job"])) tags.add("Hiring");

  return Array.from(tags).slice(0, 6);
}

function assessCurationStage(item: AiHotItem, category: NewsCategory, mode: AiHotMode): "candidate" | "published" {
  let score = 0;
  const source = item.source.toLowerCase();
  const content = `${item.title} ${item.summary}`.toLowerCase();

  if (mode === "selected") score += 2;
  if (hasAny(source, ["official", "blog", "research", "openai", "anthropic", "google", "microsoft", "meta"])) {
    score += 2;
  }
  if (["x", "twitter"].some((token) => source.includes(token))) {
    score -= 1;
  }
  if (
    category === NEWS_CATEGORY_OPTIONS[0] ||
    category === NEWS_CATEGORY_OPTIONS[2] ||
    category === NEWS_CATEGORY_OPTIONS[4] ||
    category === NEWS_CATEGORY_OPTIONS[5]
  ) {
    score += 1;
  }
  if (hasAny(content, ["launch", "release", "pricing", "funding", "hiring", "policy", "监管", "发布", "融资", "招聘"])) {
    score += 1;
  }
  if ((item.summary ?? "").trim().length < 60) {
    score -= 1;
  }

  return score >= 3 ? "published" : "candidate";
}

function summarizeCategories(items: NewsItem[]): string | undefined {
  if (!items.length) {
    return undefined;
  }

  const categoryCount = new Map<string, number>();
  for (const item of items) {
    categoryCount.set(item.category, (categoryCount.get(item.category) ?? 0) + 1);
  }

  const topCategories = Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  return `这一批内容最集中在：${topCategories.join("、")}。`;
}

function buildStableNewsId(url: string): string {
  return `aihot-${createHash("sha1").update(normalizeUrl(url)).digest("hex").slice(0, 16)}`;
}

function normalizeSentence(text: string, maxLength: number): string {
  return text.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    if (parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

function toDateOnly(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return getShanghaiToday();
  }
  return date.toISOString().slice(0, 10);
}

function clampSince(value?: number): number {
  if (!value || Number.isNaN(value)) {
    return 3;
  }
  return Math.min(14, Math.max(1, Math.trunc(value)));
}

function getShanghaiToday() {
  return SHANGHAI_DATE_FORMATTER.format(new Date());
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}
