import { unstable_noStore as noStore } from "next/cache";

import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import type { NewsItem } from "@/types/news";

export async function getNewsItems(): Promise<NewsItem[]> {
  noStore();
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
  const items = await getNewsItems();
  const exists = items.some((entry) => entry.id === item.id);
  const nextItems = exists
    ? items.map((entry) => (entry.id === item.id ? item : entry))
    : [item, ...items];

  await writeJsonFile("news.json", nextItems);
  return item;
}

export async function deleteNewsItem(id: string): Promise<void> {
  const items = await getNewsItems();
  await writeJsonFile(
    "news.json",
    items.filter((item) => item.id !== id),
  );
}

export async function setNewsItemSavedTypes(id: string, savedTypes: NewsItem["savedType"]): Promise<void> {
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
