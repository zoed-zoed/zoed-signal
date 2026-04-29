export const NEWS_CATEGORY_OPTIONS = [
  "AI 产品更新",
  "大厂战略",
  "商业化 / 融资",
  "政策与监管",
  "硬件与算力",
  "求职相关",
  "商赛 / 案例素材",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORY_OPTIONS)[number];

export const IMPORTANCE_OPTIONS = ["必看", "可扫"] as const;

export type Importance = (typeof IMPORTANCE_OPTIONS)[number];

export type SavedType = "interview" | "case" | "content" | "research";

export type NewsItem = {
  id: string;
  briefId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  category: NewsCategory;
  importance: Importance;
  whatHappened: string;
  whyImportant: string;
  relevanceToBusinessStudents: string;
  interviewOrCaseUse: string;
  nextAction: string;
  tags: string[];
  savedType: SavedType[];
};

export type Bookmark = {
  newsId: string;
  bucket: SavedType;
  createdAt: string;
};
