import { createHash } from "node:crypto";

import { getBriefById, saveBrief } from "@/lib/data/briefs";
import { getNewsItems, saveNewsItem } from "@/lib/data/news";
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
  briefId: string;
  briefTitle: string;
  fetchedCount: number;
  importedCount: number;
  skippedCount: number;
  mode: AiHotMode;
  since: number;
  items: AiHotPreviewItem[];
};

export async function fetchAiHotPreview(query: AiHotQuery = {}): Promise<AiHotPreviewItem[]> {
  const response = await fetchAiHotItems(query);
  return dedupeAiHotItems(response.items).map((item) => toPreviewItem(item, query.mode ?? "selected"));
}

export async function importAiHotItems(query: AiHotQuery = {}): Promise<AiHotImportResult> {
  const mode = query.mode ?? "selected";
  const since = clampSince(query.since);
  const response = await fetchAiHotItems({ ...query, mode, since });
  const items = dedupeAiHotItems(response.items);
  const briefDate = getShanghaiToday();
  const briefId = `aihot-${briefDate}`;
  const briefTitle = `AI HOT 精选追踪 ${briefDate}`;
  const existingBrief = await getBriefById(briefId);
  const existingItems = await getNewsItems();
  const existingByUrl = new Map(existingItems.map((item) => [normalizeUrl(item.sourceUrl), item]));

  const imported: NewsItem[] = [];

  for (const item of items) {
    const existing = existingByUrl.get(normalizeUrl(item.url));
    const mapped = mapAiHotItemToNewsItem(item, {
      briefId,
      mode,
      existingItem: existing,
    });
    await saveNewsItem(mapped);
    imported.push(mapped);
  }

  const mergedNewsItemIds = Array.from(new Set([...(existingBrief?.newsItemIds ?? []), ...imported.map((item) => item.id)]));
  const mergedTags = Array.from(new Set([...(existingBrief?.tags ?? []), "AI HOT", mode === "selected" ? "精选" : "全量"]));

  await saveBrief({
    id: briefId,
    title: existingBrief?.title ?? briefTitle,
    date: existingBrief?.date ?? briefDate,
    intro:
      existingBrief?.intro ??
      `这期内容来自 AI HOT 的 P0 试运行信源，先作为外部候选信息池使用，再按 zoed.signal 的标准做筛选和展示。`,
    tags: mergedTags,
    coreTrend: existingBrief?.coreTrend ?? summarizeCategories(imported),
    studentInsight:
      existingBrief?.studentInsight ?? "先看真实市场在讨论什么，再训练自己如何把新闻翻译成岗位、产品和商业判断。",
    contentIdeas: existingBrief?.contentIdeas ?? "优先挑选适合做求职表达、面试案例和行业观察的高价值内容。",
    resumePortfolioNote:
      existingBrief?.resumePortfolioNote ?? "后续可以把这批内容沉淀成自己的行业观察、案例库和面试素材。",
    newsItemIds: mergedNewsItemIds,
  });

  return {
    briefId,
    briefTitle: existingBrief?.title ?? briefTitle,
    fetchedCount: response.items.length,
    importedCount: imported.length,
    skippedCount: response.items.length - imported.length,
    mode,
    since,
    items: items.map((item) => toPreviewItem(item, mode)),
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
    summary: normalizeSentence(item.summary, 600),
    externalCategory: item.category,
    mappedCategory: mapAiHotCategory(item),
    mappedImportance: mode === "selected" ? "必看" : "可扫",
  };
}

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
    importance: options.mode === "selected" ? "必看" : "可扫",
    whatHappened: summary,
    whyImportant: buildWhyImportant(item, mappedCategory),
    relevanceToBusinessStudents: buildStudentValue(item, mappedCategory),
    interviewOrCaseUse: buildInterviewUse(item, mappedCategory),
    nextAction:
      options.existingItem?.nextAction ??
      "P0 阶段暂不对外展示“下一步建议”，这里先保留为内部占位字段，后续可升级为更具体的行动建议。",
    tags: buildTags(item, mappedCategory, sourceName),
    savedType: options.existingItem?.savedType ?? [],
    curationStage: options.existingItem?.curationStage ?? assessCurationStage(item, mappedCategory, options.mode),
  };
}

function mapAiHotCategory(item: AiHotItem): NewsCategory {
  const title = `${item.title} ${item.summary}`.toLowerCase();
  const source = item.source.toLowerCase();

  if (hasAny(title, ["融资", "估值", "收购", "并购", "ipo", "估值", "募资"])) {
    return NEWS_CATEGORY_OPTIONS[2];
  }

  if (hasAny(title, ["监管", "政策", "国标", "法规", "版权", "合规", "法院"])) {
    return NEWS_CATEGORY_OPTIONS[3];
  }

  if (hasAny(title, ["招聘", "实习", "校招", "jd", "岗位", "求职"])) {
    return NEWS_CATEGORY_OPTIONS[5];
  }

  if (hasAny(title, ["芯片", "gpu", "算力", "推理", "云", "rocm", "cuda", "airpods", "终端"])) {
    return NEWS_CATEGORY_OPTIONS[4];
  }

  if (item.category === "ai-products" || item.category === "ai-models") {
    return NEWS_CATEGORY_OPTIONS[0];
  }

  if (item.category === "industry") {
    return hasAny(source, ["research", "policy", "工信", "anthropic"]) ? NEWS_CATEGORY_OPTIONS[3] : NEWS_CATEGORY_OPTIONS[1];
  }

  if (item.category === "tip") {
    return hasAny(title, ["案例", "工作流", "成本", "定价", "效率", "agent", "copilot"])
      ? NEWS_CATEGORY_OPTIONS[6]
      : NEWS_CATEGORY_OPTIONS[0];
  }

  return NEWS_CATEGORY_OPTIONS[1];
}

function buildWhyImportant(item: AiHotItem, category: NewsCategory): string {
  const source = item.source.trim();

  switch (category) {
    case "AI 产品更新":
      return `这条内容说明 ${source} 正在继续推进 AI 产品或模型能力，适合用来判断行业功能迭代方向，而不只是看热度。`;
    case "大厂战略":
      return `这类动态往往不只是单点新闻，更能反映平台公司在 AI 时代的资源投入、竞争方向和业务重心变化。`;
    case "商业化 / 融资":
      return `它直接对应 AI 公司怎么挣钱、怎么融资、怎么扩张，对理解商业模式和行业阶段比单看产品更关键。`;
    case "政策与监管":
      return `政策和监管会反过来影响平台设计、内容审核、数据使用和产品边界，是商业落地不能绕开的约束条件。`;
    case "硬件与算力":
      return `AI 应用能否真正跑起来，最终都会回到算力、推理成本和基础设施效率，这类信息决定了很多产品能不能规模化。`;
    case "求职相关":
      return `它比抽象的“想转 AI”更具体，能帮助你看到真实岗位需要的能力、协作方式和业务场景。`;
    case "商赛 / 案例素材":
      return `这类内容适合转成案例素材，帮助你把新闻进一步变成产品分析、面试表达或商赛观点。`;
    default:
      return `这条内容能帮助你把 AI 热点放回商业语境里看，判断它到底是噪音，还是值得长期跟踪的信号。`;
  }
}

function buildStudentValue(item: AiHotItem, category: NewsCategory): string {
  switch (category) {
    case "AI 产品更新":
      return "适合用来观察 AI 产品在真实市场里优先升级什么能力，帮助你形成对产品方向和用户需求的基本判断。";
    case "大厂战略":
      return "适合训练你从公司动作里读战略，而不是只看技术名词，尤其适合商科同学建立行业分析框架。";
    case "商业化 / 融资":
      return "很适合商科学生理解估值、收入模式、融资节奏和市场预期之间的关系。";
    case "政策与监管":
      return "如果你关心产品、运营、平台治理或商业风险，这类内容能帮你建立比普通热点更成熟的判断。";
    case "硬件与算力":
      return "能帮你理解为什么很多 AI 产品问题最后会变成成本、部署效率和基础设施问题。";
    case "求职相关":
      return "可以直接拿来拆解岗位要求，判断自己还缺哪些能力，尤其适合准备实习、校招和转方向的同学。";
    case "商赛 / 案例素材":
      return "这类内容很适合沉淀成案例卡片，后续可用于面试、商赛、课堂展示和申请材料。";
    default:
      return "它和商科学生的关系在于：你可以借它练习把技术新闻翻译成市场、产品、竞争和职业判断。";
  }
}

function buildInterviewUse(item: AiHotItem, category: NewsCategory): string {
  switch (category) {
    case "AI 产品更新":
      return "可用于说明你如何判断一个 AI 产品更新背后的用户需求和产品策略，而不是只复述功能。";
    case "大厂战略":
      return "可作为分析大厂为什么这样布局 AI 的案例，用于面试中的行业判断题或商业分析题。";
    case "商业化 / 融资":
      return "可用于讨论 AI 公司如何验证商业模式、为什么某些阶段更看重融资或估值。";
    case "政策与监管":
      return "可用于讨论技术创新和监管约束如何平衡，适合产品治理、平台责任和政策题。";
    case "硬件与算力":
      return "可用于解释 AI 产品落地为什么不仅是模型问题，也和成本结构、部署效率密切相关。";
    case "求职相关":
      return "可直接作为岗位理解素材，帮助你在面试里更具体地表达对 AI 岗位职责的认识。";
    case "商赛 / 案例素材":
      return "适合作为商赛、案例分析或个人内容输出的选题来源，先积累观点再沉淀表达。";
    default:
      return "可作为你理解 AI 行业变化的素材，在面试或写作里证明你不是只看表面热度。";
  }
}

function buildTags(item: AiHotItem, category: NewsCategory, sourceName: string): string[] {
  const tags = new Set<string>(["AI HOT", category]);

  if (sourceName.includes("OpenAI")) tags.add("OpenAI");
  if (sourceName.includes("Anthropic")) tags.add("Anthropic");
  if (sourceName.includes("GitHub")) tags.add("GitHub");
  if (sourceName.includes("Hugging Face")) tags.add("Hugging Face");
  if (sourceName.includes("阿里")) tags.add("阿里");
  if (sourceName.includes("RSS")) tags.add("RSS");
  if (item.source.includes("X：")) tags.add("X");

  if (hasAny(item.title.toLowerCase(), ["agent"])) tags.add("Agent");
  if (hasAny(item.title, ["融资", "估值", "IPO"])) tags.add("融资");
  if (hasAny(item.title, ["招聘", "实习", "岗位", "校招"])) tags.add("求职");

  return Array.from(tags).slice(0, 6);
}

function assessCurationStage(item: AiHotItem, category: NewsCategory, mode: AiHotMode): "candidate" | "published" {
  let score = 0;
  const source = item.source.toLowerCase();
  const content = `${item.title} ${item.summary}`.toLowerCase();

  if (mode === "selected") score += 2;
  if (hasAny(source, ["official", "blog", "research", "github", "rss", "openai", "anthropic", "hugging face"])) {
    score += 2;
  }
  if (hasAny(source, ["x：", "x:", "twitter"])) {
    score -= 1;
  }
  if (["AI 产品更新", "商业化 / 融资", "硬件与算力", "求职相关"].includes(category)) {
    score += 1;
  }
  if (hasAny(content, ["招聘", "实习", "融资", "收购", "并购", "上线", "发布", "推出", "监管", "国标"])) {
    score += 1;
  }
  if (item.summary.trim().length < 60) {
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

  return `本期外部候选内容主要集中在：${topCategories.join("、")}。`;
}

function buildStableNewsId(url: string): string {
  return `aihot-${createHash("sha1").update(normalizeUrl(url)).digest("hex").slice(0, 16)}`;
}

function toDateOnly(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return getShanghaiToday();
  }

  return date.toISOString().slice(0, 10);
}

function getShanghaiToday(): string {
  return SHANGHAI_DATE_FORMATTER.format(new Date());
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value.trim();
  }
}

function normalizeSentence(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "AI HOT 返回了这条内容，但摘要暂时为空，建议后续在后台补充更具体的解释。";
  }

  return normalized.slice(0, maxLength);
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function clampSince(value: number | undefined): number {
  if (!value || Number.isNaN(value)) {
    return 3;
  }

  return Math.max(1, Math.min(14, Math.floor(value)));
}
