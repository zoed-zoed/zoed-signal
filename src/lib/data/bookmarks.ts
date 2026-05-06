import { unstable_noStore as noStore } from "next/cache";

import { sanitizeBookmarkRecord } from "@/lib/content/validation";
import { filterValidItems, logDataWarning } from "@/lib/data/guards";
import { getDataSourceMode } from "@/lib/data/source-mode";
import { getNewsById, setNewsItemSavedTypes } from "@/lib/data/news";
import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import { bookmarkFromRow, bookmarkToRow, type BookmarkRow } from "@/lib/supabase/mappers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Bookmark, SavedType } from "@/types/news";

export async function getBookmarks(): Promise<Bookmark[]> {
  noStore();

  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { data, error } = await supabase.from("bookmarks").select("*").order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to read bookmarks from Supabase: ${error.message}`);
    }

    return filterValidItems(
      "bookmarks",
      ((data ?? []) as BookmarkRow[]).map(bookmarkFromRow),
      sanitizeBookmarkRecord,
    );
  }

  const items = await readJsonFile<unknown>("bookmarks.json");
  return filterValidItems("bookmarks", Array.isArray(items) ? items : [], sanitizeBookmarkRecord);
}

export async function addBookmark(newsId: string, bucket: SavedType): Promise<Bookmark[]> {
  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { error } = await supabase.from("bookmarks").upsert(
      bookmarkToRow({
        newsId,
        bucket,
        createdAt: new Date().toISOString(),
      }),
      { onConflict: "news_id,bucket" },
    );

    if (error) {
      throw new Error(`Failed to save bookmark to Supabase: ${error.message}`);
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
  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { error } = await supabase.from("bookmarks").delete().eq("news_id", newsId).eq("bucket", bucket);

    if (error) {
      throw new Error(`Failed to delete bookmark from Supabase: ${error.message}`);
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
    logDataWarning("bookmarks", `Skipped savedType sync because news item ${newsId} does not exist`);
    return;
  }

  const savedTypes = bookmarks.filter((item) => item.newsId === newsId).map((item) => item.bucket);

  await setNewsItemSavedTypes(newsId, savedTypes);
}

function getRequiredSupabaseClient() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client is unavailable.");
  }
  return supabase;
}
