import { unstable_noStore as noStore } from "next/cache";

import { getNewsById, setNewsItemSavedTypes } from "@/lib/data/news";
import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import { bookmarkFromRow, bookmarkToRow, type BookmarkRow } from "@/lib/supabase/mappers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Bookmark, SavedType } from "@/types/news";

export async function getBookmarks(): Promise<Bookmark[]> {
  noStore();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase.from("bookmarks").select("*").order("created_at", { ascending: false });

    if (error) {
      throw new Error(`读取 Supabase 收藏失败：${error.message}`);
    }

    return (data as BookmarkRow[]).map(bookmarkFromRow);
  }

  return readJsonFile<Bookmark[]>("bookmarks.json");
}

export async function addBookmark(newsId: string, bucket: SavedType): Promise<Bookmark[]> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from("bookmarks").upsert(
      bookmarkToRow({
        newsId,
        bucket,
        createdAt: new Date().toISOString(),
      }),
      { onConflict: "news_id,bucket" },
    );

    if (error) {
      throw new Error(`保存 Supabase 收藏失败：${error.message}`);
    }

    const next = await getBookmarks();
    await syncNewsSavedTypes(newsId, next);
    return next;
  }

  const items = await getBookmarks();
  const exists = items.some((item) => item.newsId === newsId && item.bucket === bucket);
  if (exists) {
    return items;
  }

  const next = [{ newsId, bucket, createdAt: new Date().toISOString() }, ...items];
  await writeJsonFile("bookmarks.json", next);
  await syncNewsSavedTypes(newsId, next);
  return next;
}

export async function removeBookmark(newsId: string, bucket: SavedType): Promise<Bookmark[]> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from("bookmarks").delete().eq("news_id", newsId).eq("bucket", bucket);

    if (error) {
      throw new Error(`删除 Supabase 收藏失败：${error.message}`);
    }

    const next = await getBookmarks();
    await syncNewsSavedTypes(newsId, next);
    return next;
  }

  const items = await getBookmarks();
  const next = items.filter((item) => !(item.newsId === newsId && item.bucket === bucket));
  await writeJsonFile("bookmarks.json", next);
  await syncNewsSavedTypes(newsId, next);
  return next;
}

async function syncNewsSavedTypes(newsId: string, bookmarks: Bookmark[]) {
  const newsItem = await getNewsById(newsId);
  if (!newsItem) {
    return;
  }

  const savedTypes = bookmarks
    .filter((item) => item.newsId === newsId)
    .map((item) => item.bucket);

  await setNewsItemSavedTypes(newsId, savedTypes);
}
