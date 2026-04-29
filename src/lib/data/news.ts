import { unstable_noStore as noStore } from "next/cache";

import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import { newsItemFromRow, newsItemToRow, type NewsItemRow } from "@/lib/supabase/mappers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { NewsItem } from "@/types/news";

export async function getNewsItems(): Promise<NewsItem[]> {
  noStore();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase.from("news_items").select("*").order("published_at", { ascending: false });

    if (error) {
      throw new Error(`读取 Supabase 新闻失败：${error.message}`);
    }

    return (data as NewsItemRow[]).map(newsItemFromRow);
  }

  const items = await readJsonFile<NewsItem[]>("news.json");
  return items.toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("news_items")
      .upsert(newsItemToRow(item), { onConflict: "id" })
      .select()
      .single();

    if (error) {
      throw new Error(`保存 Supabase 新闻失败：${error.message}`);
    }

    return newsItemFromRow(data as NewsItemRow);
  }

  const items = await getNewsItems();
  const exists = items.some((entry) => entry.id === item.id);
  const nextItems = exists
    ? items.map((entry) => (entry.id === item.id ? item : entry))
    : [item, ...items];

  await writeJsonFile("news.json", nextItems);
  return item;
}

export async function deleteNewsItem(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from("news_items").delete().eq("id", id);

    if (error) {
      throw new Error(`删除 Supabase 新闻失败：${error.message}`);
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
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from("news_items").update({ saved_type: savedTypes }).eq("id", id);

    if (error) {
      throw new Error(`同步 Supabase 收藏用途失败：${error.message}`);
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
