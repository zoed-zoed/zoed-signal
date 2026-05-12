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
  const briefTitle = `AI HOT Daily ${briefDate}`;
  const existingBrief = await getBriefById(briefId);
  const existingItems = await getNewsItems();
  const existingByUrl = new Map(existingItems.map((item) => [normalizeUrl(item.sourceUrl), item]));

  const baseBrief = {
    id: briefId,
    title: existingBrief?.title ?? briefTitle,
    date: existingBrief?.date ?? briefDate,
    intro:
      existingBrief?.intro ??
      "This issue is imported from AI HOT as the first real external content source for zoed.signal.",
    tags: Array.from(new Set([...(existingBrief?.tags ?? []), "AI HOT", mode === "selected" ? "Selected" : "All"])),
    coreTrend: existingBrief?.coreTrend,
    studentInsight: existingBrief?.studentInsight,
    contentIdeas: existingBrief?.contentIdeas,
    resumePortfolioNote: existingBrief?.resumePortfolioNote,
    newsItemIds: existingBrief?.newsItemIds ?? [],
  };

  // Create the brief shell first so news_items.brief_id passes the foreign key check.
  await saveBrief(baseBrief);

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

  await saveBrief({
    ...baseBrief,
    coreTrend: existingBrief?.coreTrend ?? summarizeCategories(imported),
    studentInsight:
      existingBrief?.studentInsight ??
      "Focus on turning daily AI news into business judgment, interview examples, and reusable market context.",
    contentIdeas:
      existingBrief?.contentIdeas ??
      "Pick the most useful stories for students: product direction, business model, hiring signal, and case material.",
    resumePortfolioNote:
      existingBrief?.resumePortfolioNote ??
      "These stories can later become interview notes, case examples, or content assets in your own portfolio.",
    newsItemIds: mergedNewsItemIds,
  });

  return {
    briefId,
    briefTitle: baseBrief.title,
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
      return `${sourceName} is pushing a concrete AI product or model update, which helps track where product capability is really moving.`;
    case NEWS_CATEGORY_OPTIONS[1]:
      return "This is a strategy signal from a major company, useful for reading where resources and competitive focus are moving.";
    case NEWS_CATEGORY_OPTIONS[2]:
      return "This is directly about business model, financing, or commercial expansion, so it matters more than feature noise.";
    case NEWS_CATEGORY_OPTIONS[3]:
      return "Policy and compliance signals shape product boundaries and commercial rollout, so they are part of the real business context.";
    case NEWS_CATEGORY_OPTIONS[4]:
      return "AI product scale always comes back to compute and infrastructure, so hardware signals matter for real adoption.";
    case NEWS_CATEGORY_OPTIONS[5]:
      return "Hiring signals are one of the clearest ways to see what skills and workflows companies actually need right now.";
    case NEWS_CATEGORY_OPTIONS[6]:
      return "This is suitable case material because it can be turned into business examples, interview answers, or market observations.";
    default:
      return "This helps translate AI headlines into clearer business and career judgment.";
  }
}

function buildStudentValue(category: NewsCategory): string {
  switch (category) {
    case NEWS_CATEGORY_OPTIONS[0]:
      return "Useful for understanding product direction, feature priorities, and where user demand is becoming real.";
    case NEWS_CATEGORY_OPTIONS[1]:
      return "Useful for building strategy judgment instead of only remembering model names or hype cycles.";
    case NEWS_CATEGORY_OPTIONS[2]:
      return "Useful for understanding how AI companies make money and how the market evaluates growth and expansion.";
    case NEWS_CATEGORY_OPTIONS[3]:
      return "Useful for building more mature judgment about product risk, compliance, and platform governance.";
    case NEWS_CATEGORY_OPTIONS[4]:
      return "Useful for understanding why cost structure and infrastructure affect what AI products can really scale.";
    case NEWS_CATEGORY_OPTIONS[5]:
      return "Useful for job search because it shows what companies are concretely hiring for, not just what people talk about online.";
    case NEWS_CATEGORY_OPTIONS[6]:
      return "Useful as interview, writing, or competition material because it can be converted into a clear case or viewpoint.";
    default:
      return "Useful for translating AI news into business, market, and career understanding.";
  }
}

function buildInterviewUse(category: NewsCategory): string {
  switch (category) {
    case NEWS_CATEGORY_OPTIONS[0]:
      return "Use this to explain how you judge whether a product update is strategically meaningful instead of just new.";
    case NEWS_CATEGORY_OPTIONS[1]:
      return "Use this as a strategy example when discussing platform moves, resource allocation, or competition.";
    case NEWS_CATEGORY_OPTIONS[2]:
      return "Use this when discussing AI monetization, pricing, financing logic, or market expansion.";
    case NEWS_CATEGORY_OPTIONS[3]:
      return "Use this when discussing the balance between product innovation and compliance constraints.";
    case NEWS_CATEGORY_OPTIONS[4]:
      return "Use this to show that you understand AI adoption as an infrastructure and cost problem, not only a model problem.";
    case NEWS_CATEGORY_OPTIONS[5]:
      return "Use this to talk concretely about role requirements, team workflows, and what AI application jobs involve.";
    case NEWS_CATEGORY_OPTIONS[6]:
      return "Use this as case material in interviews, competitions, or written analysis.";
    default:
      return "Use this to show that you can turn daily AI news into structured business judgment.";
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

  return `Top categories in this batch: ${topCategories.join(", ")}`;
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
