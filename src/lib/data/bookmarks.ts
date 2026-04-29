import { unstable_noStore as noStore } from "next/cache";

import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import { getNewsById, setNewsItemSavedTypes } from "@/lib/data/news";
import type { Bookmark, SavedType } from "@/types/news";

export async function getBookmarks(): Promise<Bookmark[]> {
  noStore();
  return readJsonFile<Bookmark[]>("bookmarks.json");
}

export async function addBookmark(newsId: string, bucket: SavedType): Promise<Bookmark[]> {
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
