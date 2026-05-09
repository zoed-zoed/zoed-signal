import type { Brief } from "@/types/brief";
import {
  CURATION_STAGE_OPTIONS,
  IMPORTANCE_OPTIONS,
  NEWS_CATEGORY_OPTIONS,
  type Bookmark,
  type CurationStage,
  type Importance,
  type NewsCategory,
  type NewsItem,
  type SavedType,
} from "@/types/news";

const savedTypeOptions = ["interview", "case", "content", "research"] as const;

const newsCategorySet = new Set<string>(NEWS_CATEGORY_OPTIONS);
const importanceSet = new Set<string>(IMPORTANCE_OPTIONS);
const curationStageSet = new Set<string>(CURATION_STAGE_OPTIONS);
const savedTypeSet = new Set<string>(savedTypeOptions);

type ValidationMode = "input" | "storage";

type TextRule = {
  field: string;
  required?: boolean;
  maxLength?: number;
  fallback?: string;
};

export class PayloadValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: string[],
  ) {
    super(message);
    this.name = "PayloadValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getText(value: unknown, rule: TextRule, mode: ValidationMode): string {
  if (typeof value !== "string") {
    if (!rule.required && rule.fallback !== undefined) {
      return rule.fallback;
    }

    throw new PayloadValidationError(`${rule.field} invalid`, [`${rule.field} must be a string`]);
  }

  const normalized = value.trim();

  if (!normalized) {
    if (!rule.required && rule.fallback !== undefined) {
      return rule.fallback;
    }

    throw new PayloadValidationError(`${rule.field} missing`, [`${rule.field} cannot be empty`]);
  }

  const clipped = rule.maxLength ? normalized.slice(0, rule.maxLength) : normalized;
  if (!clipped && mode === "storage" && rule.fallback !== undefined) {
    return rule.fallback;
  }

  return clipped;
}

function getOptionalText(value: unknown, field: string, maxLength = 400): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function getDate(value: unknown, field: string): string {
  const text = getText(value, { field }, "input");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) {
    throw new PayloadValidationError(`${field} invalid`, [`${field} must use YYYY-MM-DD`]);
  }

  return text;
}

function getUrl(value: unknown, field: string): string {
  const text = getText(value, { field, maxLength: 2048 }, "input");

  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("invalid protocol");
    }
    return url.toString();
  } catch {
    throw new PayloadValidationError(`${field} invalid`, [`${field} must be a valid http/https URL`]);
  }
}

function getStringArray(value: unknown, field: string, maxItems: number): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const items: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const normalized = entry.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    items.push(normalized.slice(0, 40));

    if (items.length >= maxItems) {
      break;
    }
  }

  return items;
}

function getEnum<T extends string>(value: unknown, field: string, allowed: Set<string>, fallback?: T): T {
  if (typeof value === "string" && allowed.has(value)) {
    return value as T;
  }

  if (fallback) {
    return fallback;
  }

  throw new PayloadValidationError(`${field} invalid`, [`${field} is not in the allowed list`]);
}

function getId(value: unknown, field: string): string {
  return getText(value, { field, maxLength: 80 }, "input");
}

export function validateNewsItemInput(input: unknown, options?: { id?: string }): NewsItem {
  if (!isRecord(input)) {
    throw new PayloadValidationError("news payload invalid", ["news payload must be an object"]);
  }

  return {
    id: options?.id ?? getId(input.id, "id"),
    briefId: getId(input.briefId, "briefId"),
    title: getText(input.title, { field: "title", maxLength: 160 }, "input"),
    sourceName: getText(input.sourceName, { field: "sourceName", maxLength: 120 }, "input"),
    sourceUrl: getUrl(input.sourceUrl, "sourceUrl"),
    publishedAt: getDate(input.publishedAt, "publishedAt"),
    category: getEnum<NewsCategory>(input.category, "category", newsCategorySet),
    importance: getEnum<Importance>(input.importance, "importance", importanceSet),
    whatHappened: getText(input.whatHappened, { field: "whatHappened", maxLength: 600 }, "input"),
    whyImportant: getText(input.whyImportant, { field: "whyImportant", maxLength: 600 }, "input"),
    relevanceToBusinessStudents: getText(
      input.relevanceToBusinessStudents,
      { field: "relevanceToBusinessStudents", maxLength: 600 },
      "input",
    ),
    interviewOrCaseUse: getText(input.interviewOrCaseUse, { field: "interviewOrCaseUse", maxLength: 600 }, "input"),
    nextAction: getText(input.nextAction, { field: "nextAction", maxLength: 300 }, "input"),
    tags: getStringArray(input.tags, "tags", 8),
    savedType: getSavedTypes(input.savedType),
    curationStage: getEnum<CurationStage>(input.curationStage, "curationStage", curationStageSet, "published"),
  };
}

export function validateBriefInput(input: unknown, options?: { id?: string; title?: string; newsItemIds?: string[] }): Brief {
  if (!isRecord(input)) {
    throw new PayloadValidationError("brief payload invalid", ["brief payload must be an object"]);
  }

  const id = options?.id ?? getId(input.id, "id");
  const title = options?.title ?? getText(input.title, { field: "title", maxLength: 120 }, "input");

  return {
    id,
    title,
    date: getDate(input.date, "date"),
    intro: getText(input.intro, { field: "intro", maxLength: 600 }, "input"),
    tags: getStringArray(input.tags, "tags", 8),
    coreTrend: getOptionalText(input.coreTrend, "coreTrend", 400),
    studentInsight: getOptionalText(input.studentInsight, "studentInsight", 400),
    contentIdeas: getOptionalText(input.contentIdeas, "contentIdeas", 400),
    resumePortfolioNote: getOptionalText(input.resumePortfolioNote, "resumePortfolioNote", 400),
    newsItemIds: options?.newsItemIds ?? getStringArray(input.newsItemIds, "newsItemIds", 100),
  };
}

export function validateBookmarkInput(input: unknown): { newsId: string; bucket: SavedType } {
  if (!isRecord(input)) {
    throw new PayloadValidationError("bookmark payload invalid", ["bookmark payload must be an object"]);
  }

  return {
    newsId: getId(input.newsId, "newsId"),
    bucket: getEnum<SavedType>(input.bucket, "bucket", savedTypeSet),
  };
}

export function sanitizeNewsItemRecord(input: unknown): NewsItem | null {
  try {
    return validateNewsItemInput(input);
  } catch {
    return null;
  }
}

export function sanitizeBriefRecord(input: unknown): Brief | null {
  try {
    return validateBriefInput(input);
  } catch {
    return null;
  }
}

export function sanitizeBookmarkRecord(input: unknown): Bookmark | null {
  if (!isRecord(input)) {
    return null;
  }

  try {
    return {
      newsId: getId(input.newsId, "newsId"),
      bucket: getEnum<SavedType>(input.bucket, "bucket", savedTypeSet),
      createdAt: getDateTime(input.createdAt, "createdAt"),
    };
  } catch {
    return null;
  }
}

function getDateTime(value: unknown, field: string): string {
  const text = getText(value, { field, maxLength: 64 }, "storage");
  if (Number.isNaN(Date.parse(text))) {
    throw new PayloadValidationError(`${field} invalid`, [`${field} must be a valid datetime`]);
  }
  return new Date(text).toISOString();
}

function getSavedTypes(value: unknown): SavedType[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: SavedType[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || !savedTypeSet.has(entry) || result.includes(entry as SavedType)) {
      continue;
    }
    result.push(entry as SavedType);
  }

  return result;
}
