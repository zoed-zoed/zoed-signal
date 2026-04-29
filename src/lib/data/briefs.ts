import { unstable_noStore as noStore } from "next/cache";

import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import { briefFromRow, briefToRow, type BriefRow } from "@/lib/supabase/mappers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Brief } from "@/types/brief";

export async function getBriefs(): Promise<Brief[]> {
  noStore();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase.from("briefs").select("*").order("date", { ascending: false });

    if (error) {
      throw new Error(`读取 Supabase 简报失败：${error.message}`);
    }

    return (data as BriefRow[]).map(briefFromRow);
  }

  const briefs = await readJsonFile<Brief[]>("briefs.json");
  return briefs.toSorted((a, b) => b.date.localeCompare(a.date));
}

export async function getBriefById(id: string): Promise<Brief | undefined> {
  const briefs = await getBriefs();
  return briefs.find((brief) => brief.id === id);
}

export async function saveBrief(brief: Brief): Promise<Brief> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("briefs")
      .upsert(briefToRow(brief), { onConflict: "id" })
      .select()
      .single();

    if (error) {
      throw new Error(`保存 Supabase 简报失败：${error.message}`);
    }

    return briefFromRow(data as BriefRow);
  }

  const briefs = await getBriefs();
  const exists = briefs.some((entry) => entry.id === brief.id);
  const nextBriefs = exists
    ? briefs.map((entry) => (entry.id === brief.id ? brief : entry))
    : [brief, ...briefs];

  await writeJsonFile("briefs.json", nextBriefs);
  return brief;
}

export async function deleteBrief(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { error } = await supabase.from("briefs").delete().eq("id", id);

    if (error) {
      throw new Error(`删除 Supabase 简报失败：${error.message}`);
    }

    return;
  }

  const briefs = await getBriefs();
  await writeJsonFile(
    "briefs.json",
    briefs.filter((brief) => brief.id !== id),
  );
}
