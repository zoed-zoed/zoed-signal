import { unstable_noStore as noStore } from "next/cache";

import { sanitizeNewsItemRecord } from "@/lib/content/validation";
import { filterValidItems } from "@/lib/data/guards";
import { getDataSourceMode } from "@/lib/data/source-mode";
import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import { newsItemFromRow, newsItemToRow, type NewsItemRow } from "@/lib/supabase/mappers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { NewsItem } from "@/types/news";

export async function getNewsItems(options?: { onlyPublished?: boolean }): Promise<NewsItem[]> {
  noStore();

  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    let query = supabase.from("news_items").select("*").order("published_at", { ascending: false });

    if (options?.onlyPublished) {
      query = query.eq("curation_stage", "published");
    }

    const { data, error } = await query;

    if (error && options?.onlyPublished && isMissingCurationStageColumn(error.message)) {
      const fallback = await supabase.from("news_items").select("*").order("published_at", { ascending: false });

      if (fallback.error) {
        throw new Error(`Failed to read news items from Supabase: ${fallback.error.message}`);
      }

      return filterValidItems(
        "news",
        ((fallback.data ?? []) as NewsItemRow[]).map(newsItemFromRow),
        sanitizeNewsItemRecord,
      ).filter((item) => item.curationStage === "published");
    }

    if (error) {
      throw new Error(`Failed to read news items from Supabase: ${error.message}`);
    }

    return filterValidItems("news", ((data ?? []) as NewsItemRow[]).map(newsItemFromRow), sanitizeNewsItemRecord);
  }

  const items = await readJsonFile<unknown>("news.json");
  return filterValidItems("news", Array.isArray(items) ? items : [], sanitizeNewsItemRecord)
    .filter((item) => (options?.onlyPublished ? item.curationStage === "published" : true))
    .toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getNewsById(id: string): Promise<NewsItem | undefined> {
  const items = await getNewsItems();
  return items.find((item) => item.id === id);
}

export async function getNewsForBrief(briefId: string): Promise<NewsItem[]> {
  const items = await getNewsItems({ onlyPublished: true });
  return items.filter((item) => item.briefId === briefId);
}

export async function getAllNewsForBrief(briefId: string): Promise<NewsItem[]> {
  const items = await getNewsItems();
  return items.filter((item) => item.briefId === briefId);
}

export async function saveNewsItem(item: NewsItem): Promise<NewsItem> {
  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const row = newsItemToRow(item);
    const attempt = await supabase
      .from("news_items")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();

    if (attempt.error && isMissingCurationStageColumn(attempt.error.message)) {
      const legacyRow: Omit<NewsItemRow, "curation_stage"> = {
        id: row.id,
        brief_id: row.brief_id,
        title: row.title,
        source_name: row.source_name,
        source_url: row.source_url,
        published_at: row.published_at,
        category: row.category,
        importance: row.importance,
        what_happened: row.what_happened,
        why_important: row.why_important,
        relevance_to_business_students: row.relevance_to_business_students,
        interview_or_case_use: row.interview_or_case_use,
        next_action: row.next_action,
        tags: row.tags,
        saved_type: row.saved_type,
      };
      const fallback = await supabase
        .from("news_items")
        .upsert(legacyRow, { onConflict: "id" })
        .select()
        .single();

      if (fallback.error) {
        throw new Error(`Failed to save news item to Supabase: ${fallback.error.message}`);
      }

      return sanitizeNewsItemRecord(newsItemFromRow(fallback.data as NewsItemRow)) ?? item;
    }

    if (attempt.error) {
      throw new Error(`Failed to save news item to Supabase: ${attempt.error.message}`);
    }

    return sanitizeNewsItemRecord(newsItemFromRow(attempt.data as NewsItemRow)) ?? item;
  }

  const items = await getNewsItems();
  const exists = items.some((entry) => entry.id === item.id);
  const nextItems = exists ? items.map((entry) => (entry.id === item.id ? item : entry)) : [item, ...items];

  await writeJsonFile("news.json", nextItems);
  return item;
}

export async function deleteNewsItem(id: string): Promise<void> {
  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { error } = await supabase.from("news_items").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete news item from Supabase: ${error.message}`);
    }

    return;
  }

  const items = await getNewsItems();
  await writeJsonFile(
    "news.json",
    items.filter((item) => item.id !== id),
  );
}

export async function setNewsItemSavedTypes(id: string, savedTypes: NewsItem["savedType"]): Promise<void> {
  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { error } = await supabase.from("news_items").update({ saved_type: savedTypes }).eq("id", id);

    if (error) {
      throw new Error(`Failed to sync saved types to Supabase: ${error.message}`);
    }

    return;
  }

  const items = await getNewsItems();
  const nextItems = items.map((item) =>
    item.id === id
      ? {
          ...item,
          savedType: savedTypes,
        }
      : item,
  );

  await writeJsonFile("news.json", nextItems);
}

function getRequiredSupabaseClient() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client is unavailable.");
  }
  return supabase;
}

function isMissingCurationStageColumn(message: string) {
  return message.includes("curation_stage") && message.includes("column");
}
