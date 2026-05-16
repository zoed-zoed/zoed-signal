"use client";

import { useEffect, useState } from "react";

type DiagnosticsState =
  | { status: "loading" }
  | {
      status: "ready";
      payload: DiagnosticsPayload;
    }
  | { status: "error"; message: string };

type DiagnosticsPayload = {
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

export function SupabaseConnectionCheck() {
  const [state, setState] = useState<DiagnosticsState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function runCheck() {
      try {
        const response = await fetch("/api/admin/supabase-diagnostics", {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as DiagnosticsPayload;

        if (!active) {
          return;
        }

        if (!response.ok) {
          setState({ status: "error", message: "读取 Supabase 诊断信息失败。" });
          return;
        }

        setState({ status: "ready", payload });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          status: "error",
          message: error instanceof Error ? error.message : "读取 Supabase 诊断信息失败。",
        });
      }
    }

    void runCheck();

    return () => {
      active = false;
    };
  }, []);

  return (
    <article className="glass-panel rounded-[30px] p-6">
      <p className="section-label">Supabase Check</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--charcoal)]">
        真实诊断当前 Supabase 接入状态
      </h3>

      {state.status === "loading" ? (
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">正在检查环境变量、迁移缺口和匿名读取状态...</p>
      ) : null}

      {state.status === "error" ? (
        <StatusBox tone="error" title="诊断接口读取失败">
          {state.message}
        </StatusBox>
      ) : null}

      {state.status === "ready" ? (
        <div className="mt-5 space-y-4">
          <StatusBox tone="neutral" title="环境变量">
            <ul className="space-y-2">
              <li>数据源模式：{state.payload.sourceMode}</li>
              <li>NEXT_PUBLIC_SUPABASE_URL：{labelBoolean(state.payload.env.publicUrl)}</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY：{labelBoolean(state.payload.env.anonKey)}</li>
              <li>SUPABASE_SERVICE_ROLE_KEY：{labelBoolean(state.payload.env.serviceRoleKey)}</li>
            </ul>
          </StatusBox>

          <StatusBox
            tone={hasMigrationGap(state.payload.tables) ? "warning" : "success"}
            title="迁移检查"
          >
            <ul className="space-y-2">
              <li>`news_items` 表：{labelBoolean(state.payload.tables.newsItems)}</li>
              <li>`news_items.curation_stage`：{labelBoolean(state.payload.tables.curationStage)}</li>
              <li>`source_import_runs` 表：{labelBoolean(state.payload.tables.sourceImportRuns)}</li>
              <li>`source_items_raw` 表：{labelBoolean(state.payload.tables.sourceItemsRaw)}</li>
            </ul>
          </StatusBox>

          <StatusBox
            tone={state.payload.service.error ? "error" : "success"}
            title="服务端读取"
          >
            {state.payload.service.error ? (
              state.payload.service.error
            ) : (
              <div className="space-y-2">
                <p>可用于前台的公开新闻数：{state.payload.service.newsItemCount ?? 0}</p>
                {state.payload.service.latestPublished ? (
                  <p>
                    最新公开新闻：{state.payload.service.latestPublished.title}（{state.payload.service.latestPublished.publishedAt}）
                  </p>
                ) : (
                  <p>当前没有公开新闻数据。</p>
                )}
              </div>
            )}
          </StatusBox>

          <StatusBox
            tone={state.payload.anon.status === "ok" ? "success" : state.payload.anon.status === "empty" ? "warning" : "error"}
            title="前台 anon 读取"
          >
            {state.payload.anon.status === "ok" ? (
              <p>匿名读取正常，当前 anon 可以读到 {state.payload.anon.count ?? 0} 条公开新闻。</p>
            ) : null}
            {state.payload.anon.status === "empty" ? (
              <p>匿名读取已经通了，但当前没有任何可读的公开新闻。</p>
            ) : null}
            {state.payload.anon.status === "error" ? (
              <p>{state.payload.anon.error}</p>
            ) : null}
            {state.payload.anon.status === "skipped" ? (
              <p>当前跳过了 anon 读取检查。</p>
            ) : null}
          </StatusBox>
        </div>
      ) : null}
    </article>
  );
}

function StatusBox({
  tone,
  title,
  children,
}: {
  tone: "neutral" | "success" | "warning" | "error";
  title: string;
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-[rgba(35,93,58,0.18)] bg-[rgba(35,93,58,0.08)]"
      : tone === "warning"
        ? "border-[rgba(212,155,82,0.22)] bg-[rgba(212,155,82,0.12)]"
        : tone === "error"
          ? "border-[rgba(202,93,52,0.18)] bg-[var(--accent-soft)]"
          : "border-[var(--line)] bg-white/75";

  return (
    <div className={`rounded-[22px] border p-4 text-sm leading-7 text-[var(--muted)] ${toneClass}`}>
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function labelBoolean(value: boolean) {
  return value ? "已配置 / 存在" : "缺失";
}

function hasMigrationGap(tables: {
  newsItems: boolean;
  curationStage: boolean;
  sourceImportRuns: boolean;
  sourceItemsRaw: boolean;
}) {
  return !tables.newsItems || !tables.curationStage || !tables.sourceImportRuns || !tables.sourceItemsRaw;
}
