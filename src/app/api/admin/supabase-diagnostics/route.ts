import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getDataSourceMode } from "@/lib/data/source-mode";
import { getSupabaseServerClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

type DiagnosticsResponse = {
  sourceMode: string;
  env: {
    publicUrl: boolean;
    anonKey: boolean;
    serviceRoleKey: boolean;
  };
  tables: {
    newsItems: boolean;
    curationStage: boolean;
    sourceImportRuns: boolean;
    sourceItemsRaw: boolean;
  };
  service: {
    newsItemCount?: number;
    latestPublished?: {
      id: string;
      title: string;
      publishedAt: string;
    };
    error?: string;
  };
  anon: {
    status: "ok" | "empty" | "error" | "skipped";
    count?: number;
    error?: string;
  };
};

export async function GET() {
  const sourceMode = getDataSourceMode();
  const publicUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const response: DiagnosticsResponse = {
    sourceMode,
    env: {
      publicUrl,
      anonKey,
      serviceRoleKey,
    },
    tables: {
      newsItems: false,
      curationStage: false,
      sourceImportRuns: false,
      sourceItemsRaw: false,
    },
    service: {},
    anon: {
      status: "skipped",
    },
  };

  if (!hasSupabaseServerConfig()) {
    response.service.error = "服务端缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY。";
    return NextResponse.json(response);
  }

  const supabase = getRequiredSupabaseServerClient();
  response.tables.newsItems = await hasSelectableTable(supabase, "news_items", "id");
  response.tables.sourceImportRuns = await hasSelectableTable(supabase, "source_import_runs", "id");
  response.tables.sourceItemsRaw = await hasSelectableTable(supabase, "source_items_raw", "id");
  response.tables.curationStage = await hasSelectableColumn(supabase, "news_items", "curation_stage");

  try {
    const countResult = response.tables.curationStage
      ? await supabase
          .from("news_items")
          .select("id", { count: "exact", head: true })
          .eq("curation_stage", "published")
      : await supabase.from("news_items").select("id", { count: "exact", head: true });

    if (countResult.error) {
      throw countResult.error;
    }

    response.service.newsItemCount = countResult.count ?? 0;

    const latestResult = response.tables.curationStage
      ? await supabase
          .from("news_items")
          .select("id,title,published_at")
          .eq("curation_stage", "published")
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : await supabase
          .from("news_items")
          .select("id,title,published_at")
          .order("published_at", { ascending: false })
          .limit(1)
          .maybeSingle();

    if (latestResult.error) {
      throw latestResult.error;
    }

    if (latestResult.data) {
      response.service.latestPublished = {
        id: String(latestResult.data.id),
        title: String(latestResult.data.title),
        publishedAt: String(latestResult.data.published_at),
      };
    }
  } catch (error) {
    response.service.error = error instanceof Error ? error.message : "服务端读取 news_items 失败。";
  }

  if (!publicUrl || !anonKey) {
    response.anon = {
      status: "error",
      error: "前端缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY。",
    };
    return NextResponse.json(response);
  }

  const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const anonResult = response.tables.curationStage
    ? await anonClient
        .from("news_items")
        .select("id", { count: "exact", head: true })
        .eq("curation_stage", "published")
    : await anonClient.from("news_items").select("id", { count: "exact", head: true });

  if (anonResult.error) {
    response.anon = {
      status: "error",
      error: anonResult.error.message,
    };
  } else if ((anonResult.count ?? 0) === 0) {
    response.anon = {
      status: "empty",
      count: 0,
    };
  } else {
    response.anon = {
      status: "ok",
      count: anonResult.count ?? 0,
    };
  }

  return NextResponse.json(response);
}

function getRequiredSupabaseServerClient() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase service client is unavailable.");
  }
  return supabase;
}

async function hasSelectableTable(
  supabase: ReturnType<typeof getRequiredSupabaseServerClient>,
  table: string,
  column: string,
) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error || !isMissingRelation(error.message);
}

async function hasSelectableColumn(
  supabase: ReturnType<typeof getRequiredSupabaseServerClient>,
  table: string,
  column: string,
) {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error || !isMissingColumn(error.message, column);
}

function isMissingRelation(message: string) {
  return message.includes("relation") && message.includes("does not exist");
}

function isMissingColumn(message: string, column: string) {
  return message.includes("column") && message.includes(column) && message.includes("does not exist");
}
