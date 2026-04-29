import { unstable_noStore as noStore } from "next/cache";

import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import type { Brief } from "@/types/brief";

export async function getBriefs(): Promise<Brief[]> {
  noStore();
  const briefs = await readJsonFile<Brief[]>("briefs.json");
  return briefs.toSorted((a, b) => b.date.localeCompare(a.date));
}

export async function getBriefById(id: string): Promise<Brief | undefined> {
  const briefs = await getBriefs();
  return briefs.find((brief) => brief.id === id);
}

export async function saveBrief(brief: Brief): Promise<Brief> {
  const briefs = await getBriefs();
  const exists = briefs.some((entry) => entry.id === brief.id);
  const nextBriefs = exists
    ? briefs.map((entry) => (entry.id === brief.id ? brief : entry))
    : [brief, ...briefs];

  await writeJsonFile("briefs.json", nextBriefs);
  return brief;
}

export async function deleteBrief(id: string): Promise<void> {
  const briefs = await getBriefs();
  await writeJsonFile(
    "briefs.json",
    briefs.filter((brief) => brief.id !== id),
  );
}
