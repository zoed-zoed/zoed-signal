import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

function parseEnvFile(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((acc, line) => {
      const index = line.indexOf("=");
      if (index === -1) {
        return acc;
      }

      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      acc[key] = value;
      return acc;
    }, {});
}

async function loadEnv() {
  const envFiles = [".env.local", ".env"];
  const merged = {};

  for (const file of envFiles) {
    try {
      const content = await readFile(path.join(root, file), "utf8");
      Object.assign(merged, parseEnvFile(content));
    } catch {
      // ignore missing env files
    }
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? merged.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? merged.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function readJson(relativePath) {
  const content = await readFile(path.join(root, relativePath), "utf8");
  return JSON.parse(content.replace(/^\uFEFF/, ""));
}

function briefToRow(brief) {
  return {
    id: brief.id,
    title: brief.title,
    date: brief.date,
    intro: brief.intro,
    tags: brief.tags ?? [],
    core_trend: brief.coreTrend ?? null,
    student_insight: brief.studentInsight ?? null,
    content_ideas: brief.contentIdeas ?? null,
    resume_portfolio_note: brief.resumePortfolioNote ?? null,
    news_item_ids: brief.newsItemIds ?? [],
  };
}

function newsToRow(item) {
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
    tags: item.tags ?? [],
    saved_type: item.savedType ?? [],
  };
}

function bookmarkToRow(item) {
  return {
    news_id: item.newsId,
    bucket: item.bucket,
    created_at: item.createdAt,
  };
}

async function main() {
  const env = await loadEnv();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "缺少 Supabase 环境变量。请先在项目根目录创建 .env.local，并填入 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY。",
    );
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const [briefs, news, bookmarks] = await Promise.all([
    readJson("data/briefs.json"),
    readJson("data/news.json"),
    readJson("data/bookmarks.json"),
  ]);

  const { error: briefsError } = await supabase.from("briefs").upsert(briefs.map(briefToRow), {
    onConflict: "id",
  });
  if (briefsError) {
    throw briefsError;
  }

  const { error: newsError } = await supabase.from("news_items").upsert(news.map(newsToRow), {
    onConflict: "id",
  });
  if (newsError) {
    throw newsError;
  }

  const { error: bookmarksError } = await supabase.from("bookmarks").upsert(bookmarks.map(bookmarkToRow), {
    onConflict: "news_id,bucket",
  });
  if (bookmarksError) {
    throw bookmarksError;
  }

  console.log(
    JSON.stringify(
      {
        syncedBriefs: briefs.length,
        syncedNewsItems: news.length,
        syncedBookmarks: bookmarks.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("同步到 Supabase 失败：", error.message);
  process.exit(1);
});
