import { unstable_noStore as noStore } from "next/cache";

import { getDataSourceMode } from "@/lib/data/source-mode";
import { readJsonFile, writeJsonFile } from "@/lib/storage/file-db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SourceFeedInput = {
  id: string;
  name: string;
  sourceType: "api" | "rss" | "manual" | "web";
  baseUrl?: string;
  notes?: string;
};

type SourceImportTriggerType = "manual" | "scheduled" | "retry";
type SourceImportRunStatus = "queued" | "running" | "success" | "failed";
type SourceItemProcessingStatus = "pending" | "normalized" | "imported" | "duplicate" | "failed";

export type SourceImportRun = {
  id: number;
  feedId: string | null;
  runStatus: SourceImportRunStatus;
  triggerType: SourceImportTriggerType;
  fetchedCount: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  startedAt: string;
  finishedAt?: string;
  notes?: string;
};

export type SourceItemRawRecord = {
  runId: number | null;
  feedId: string | null;
  externalId?: string | null;
  sourceUrl?: string | null;
  title?: string | null;
  publishedAt?: string | null;
  rawPayload: Record<string, unknown>;
  normalizedSummary?: string | null;
  dedupeKey?: string | null;
  processingStatus: SourceItemProcessingStatus;
  mappedNewsItemId?: string | null;
};

type SourceImportRunRow = {
  id: number;
  feed_id: string | null;
  run_status: SourceImportRunStatus;
  trigger_type: SourceImportTriggerType;
  fetched_count: number;
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
};

type SourceItemRawRow = {
  run_id: number | null;
  feed_id: string | null;
  external_id: string | null;
  source_url: string | null;
  title: string | null;
  published_at: string | null;
  raw_payload: Record<string, unknown>;
  normalized_summary: string | null;
  dedupe_key: string | null;
  processing_status: SourceItemProcessingStatus;
  mapped_news_item_id: string | null;
};

export async function ensureSourceFeed(feed: SourceFeedInput) {
  if (getDataSourceMode() !== "supabase") {
    return;
  }

  const supabase = getRequiredSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("source_feeds").upsert(
    {
      id: feed.id,
      name: feed.name,
      source_type: feed.sourceType,
      base_url: feed.baseUrl ?? null,
      is_active: true,
      notes: feed.notes ?? null,
      updated_at: now,
      created_at: now,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(`Failed to ensure source feed ${feed.id}: ${error.message}`);
  }
}

export async function createSourceImportRun(input: {
  feedId: string | null;
  triggerType: SourceImportTriggerType;
  notes?: string;
}): Promise<SourceImportRun> {
  noStore();

  const startedAt = new Date().toISOString();
  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { data, error } = await supabase
      .from("source_import_runs")
      .insert({
        feed_id: input.feedId,
        run_status: "running",
        trigger_type: input.triggerType,
        fetched_count: 0,
        imported_count: 0,
        skipped_count: 0,
        failed_count: 0,
        started_at: startedAt,
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create source import run: ${error.message}`);
    }

    return runFromRow(data as SourceImportRunRow);
  }

  const runs = await readJsonArray<SourceImportRun>("source_import_runs.json");
  const run: SourceImportRun = {
    id: nextNumericId(runs),
    feedId: input.feedId,
    runStatus: "running",
    triggerType: input.triggerType,
    fetchedCount: 0,
    importedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    startedAt,
    notes: input.notes,
  };

  await writeJsonFile("source_import_runs.json", [run, ...runs]);
  return run;
}

export async function finalizeSourceImportRun(
  runId: number,
  patch: {
    runStatus: SourceImportRunStatus;
    fetchedCount: number;
    importedCount: number;
    skippedCount: number;
    failedCount: number;
    notes?: string;
  },
) {
  const finishedAt = new Date().toISOString();

  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { error } = await supabase
      .from("source_import_runs")
      .update({
        run_status: patch.runStatus,
        fetched_count: patch.fetchedCount,
        imported_count: patch.importedCount,
        skipped_count: patch.skippedCount,
        failed_count: patch.failedCount,
        finished_at: finishedAt,
        notes: patch.notes ?? null,
      })
      .eq("id", runId);

    if (error) {
      throw new Error(`Failed to finalize source import run ${runId}: ${error.message}`);
    }

    return;
  }

  const runs = await readJsonArray<SourceImportRun>("source_import_runs.json");
  const nextRuns = runs.map((run) =>
    run.id === runId
      ? {
          ...run,
          runStatus: patch.runStatus,
          fetchedCount: patch.fetchedCount,
          importedCount: patch.importedCount,
          skippedCount: patch.skippedCount,
          failedCount: patch.failedCount,
          finishedAt,
          notes: patch.notes,
        }
      : run,
  );

  await writeJsonFile("source_import_runs.json", nextRuns);
}

export async function saveSourceItemRawRecords(records: SourceItemRawRecord[]) {
  if (!records.length) {
    return;
  }

  if (getDataSourceMode() === "supabase") {
    const supabase = getRequiredSupabaseClient();
    const { error } = await supabase.from("source_items_raw").insert(records.map(toRow));

    if (error) {
      throw new Error(`Failed to save source item raw records: ${error.message}`);
    }

    return;
  }

  const items = await readJsonArray<(SourceItemRawRecord & { id: number })>("source_items_raw.json");
  let nextId = nextNumericId(items);
  const nextItems = [
    ...records.map((record) => ({
      id: nextId++,
      ...record,
    })),
    ...items,
  ];

  await writeJsonFile("source_items_raw.json", nextItems);
}

function runFromRow(row: SourceImportRunRow): SourceImportRun {
  return {
    id: row.id,
    feedId: row.feed_id,
    runStatus: row.run_status,
    triggerType: row.trigger_type,
    fetchedCount: row.fetched_count,
    importedCount: row.imported_count,
    skippedCount: row.skipped_count,
    failedCount: row.failed_count,
    startedAt: row.started_at,
    finishedAt: row.finished_at ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toRow(record: SourceItemRawRecord): SourceItemRawRow {
  return {
    run_id: record.runId,
    feed_id: record.feedId,
    external_id: record.externalId ?? null,
    source_url: record.sourceUrl ?? null,
    title: record.title ?? null,
    published_at: record.publishedAt ?? null,
    raw_payload: record.rawPayload,
    normalized_summary: record.normalizedSummary ?? null,
    dedupe_key: record.dedupeKey ?? null,
    processing_status: record.processingStatus,
    mapped_news_item_id: record.mappedNewsItemId ?? null,
  };
}

async function readJsonArray<T>(fileName: string): Promise<T[]> {
  try {
    const data = await readJsonFile<unknown>(fileName);
    return Array.isArray(data) ? (data as T[]) : [];
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function nextNumericId(items: Array<{ id: number }>) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function getRequiredSupabaseClient() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client is unavailable.");
  }
  return supabase;
}
