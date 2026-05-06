import { unstable_noStore as noStore } from "next/cache";

import { sanitizeNewsItemRecord } from "@/lib/content/validation";
import { filterValidItems } from "@/lib/data/guards";
import { getDataSourceMode } from "@/lib/data/source-mode";
import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import { newsItemFromRow, newsItemToRow, type NewsItemRow } from "@/lib/supabase/mappers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { NewsItem } from "@/types/news";

export async function getNewsItems(): Promise<NewsItem[]> {
  noStore();

  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { data, error } = await supabase.from("news_items").select("*").order("published_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to read news items from Supabase: ${error.message}`);
    }

    return filterValidItems("news", ((data ?? []) as NewsItemRow[]).map(newsItemFromRow), sanitizeNewsItemRecord);
  }

  const items = await readJsonFile<unknown>("news.json");
  return filterValidItems("news", Array.isArray(items) ? items : [], sanitizeNewsItemRecord).toSorted((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
}

export async function getNewsById(id: string): Promise<NewsItem | undefined> {
  const items = await getNewsItems();
  return items.find((item) => item.id === id);
}

export async function getNewsForBrief(briefId: string): Promise<NewsItem[]> {
  const items = await getNewsItems();
  return items.filter((item) => item.briefId === briefId);
}

export async function saveNewsItem(item: NewsItem): Promise<NewsItem> {
  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { data, error } = await supabase
      .from("news_items")
      .upsert(newsItemToRow(item), { onConflict: "id" })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save news item to Supabase: ${error.message}`);
    }

    return sanitizeNewsItemRecord(newsItemFromRow(data as NewsItemRow)) ?? item;
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
