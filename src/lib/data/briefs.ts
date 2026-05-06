import { unstable_noStore as noStore } from "next/cache";

import { sanitizeBriefRecord } from "@/lib/content/validation";
import { filterValidItems } from "@/lib/data/guards";
import { getDataSourceMode } from "@/lib/data/source-mode";
import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import { briefFromRow, briefToRow, type BriefRow } from "@/lib/supabase/mappers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Brief } from "@/types/brief";

export async function getBriefs(): Promise<Brief[]> {
  noStore();

  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { data, error } = await supabase.from("briefs").select("*").order("date", { ascending: false });

    if (error) {
      throw new Error(`Failed to read briefs from Supabase: ${error.message}`);
    }

    return filterValidItems("briefs", ((data ?? []) as BriefRow[]).map(briefFromRow), sanitizeBriefRecord);
  }

  const briefs = await readJsonFile<unknown>("briefs.json");
  return filterValidItems("briefs", Array.isArray(briefs) ? briefs : [], sanitizeBriefRecord).toSorted((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export async function getBriefById(id: string): Promise<Brief | undefined> {
  const briefs = await getBriefs();
  return briefs.find((brief) => brief.id === id);
}

export async function saveBrief(brief: Brief): Promise<Brief> {
  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { data, error } = await supabase
      .from("briefs")
      .upsert(briefToRow(brief), { onConflict: "id" })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save brief to Supabase: ${error.message}`);
    }

    return sanitizeBriefRecord(briefFromRow(data as BriefRow)) ?? brief;
  }

  const briefs = await getBriefs();
  const exists = briefs.some((entry) => entry.id === brief.id);
  const nextBriefs = exists ? briefs.map((entry) => (entry.id === brief.id ? brief : entry)) : [brief, ...briefs];

  await writeJsonFile("briefs.json", nextBriefs);
  return brief;
}

export async function deleteBrief(id: string): Promise<void> {
  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { error } = await supabase.from("briefs").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete brief from Supabase: ${error.message}`);
    }

    return;
  }

  const briefs = await getBriefs();
  await writeJsonFile(
    "briefs.json",
    briefs.filter((brief) => brief.id !== id),
  );
}

function getRequiredSupabaseClient() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client is unavailable.");
  }
  return supabase;
}
