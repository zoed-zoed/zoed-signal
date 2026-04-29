import type { Brief } from "@/types/brief";
import type { Bookmark, NewsItem, SavedType } from "@/types/news";

export type BriefRow = {
  id: string;
  title: string;
  date: string;
  intro: string;
  tags: string[] | null;
  core_trend: string | null;
  student_insight: string | null;
  content_ideas: string | null;
  resume_portfolio_note: string | null;
  news_item_ids: string[] | null;
};

export type NewsItemRow = {
  id: string;
  brief_id: string;
  title: string;
  source_name: string;
  source_url: string;
  published_at: string;
  category: NewsItem["category"];
  importance: NewsItem["importance"];
  what_happened: string;
  why_important: string;
  relevance_to_business_students: string;
  interview_or_case_use: string;
  next_action: string;
  tags: string[] | null;
  saved_type: SavedType[] | null;
};

export type BookmarkRow = {
  news_id: string;
  bucket: SavedType;
  created_at: string;
};

function normalizeArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

export function briefFromRow(row: BriefRow): Brief {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    intro: row.intro,
    tags: normalizeArray(row.tags),
    coreTrend: row.core_trend ?? undefined,
    studentInsight: row.student_insight ?? undefined,
    contentIdeas: row.content_ideas ?? undefined,
    resumePortfolioNote: row.resume_portfolio_note ?? undefined,
    newsItemIds: normalizeArray(row.news_item_ids),
  };
}

export function briefToRow(brief: Brief): BriefRow {
  return {
    id: brief.id,
    title: brief.title,
    date: brief.date,
    intro: brief.intro,
    tags: normalizeArray(brief.tags),
    core_trend: brief.coreTrend ?? null,
    student_insight: brief.studentInsight ?? null,
    content_ideas: brief.contentIdeas ?? null,
    resume_portfolio_note: brief.resumePortfolioNote ?? null,
    news_item_ids: normalizeArray(brief.newsItemIds),
  };
}

export function newsItemFromRow(row: NewsItemRow): NewsItem {
  return {
    id: row.id,
    briefId: row.brief_id,
    title: row.title,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    publishedAt: row.published_at,
    category: row.category,
    importance: row.importance,
    whatHappened: row.what_happened,
    whyImportant: row.why_important,
    relevanceToBusinessStudents: row.relevance_to_business_students,
    interviewOrCaseUse: row.interview_or_case_use,
    nextAction: row.next_action,
    tags: normalizeArray(row.tags),
    savedType: normalizeArray(row.saved_type),
  };
}

export function newsItemToRow(item: NewsItem): NewsItemRow {
  return {
    id: item.id,
    brief_id: item.briefId,
    title: item.title,
    source_name: item.sourceName,
    source_url: item.sourceUrl,
    published_at: item.publishedAt,
    category: item.category,
    importance: item.importance,
    what_happened: item.whatHappened,
    why_important: item.whyImportant,
    relevance_to_business_students: item.relevanceToBusinessStudents,
    interview_or_case_use: item.interviewOrCaseUse,
    next_action: item.nextAction,
    tags: normalizeArray(item.tags),
    saved_type: normalizeArray(item.savedType),
  };
}

export function bookmarkFromRow(row: BookmarkRow): Bookmark {
  return {
    newsId: row.news_id,
    bucket: row.bucket,
    createdAt: row.created_at,
  };
}

export function bookmarkToRow(bookmark: Bookmark): BookmarkRow {
  return {
    news_id: bookmark.newsId,
    bucket: bookmark.bucket,
    created_at: bookmark.createdAt,
  };
}
