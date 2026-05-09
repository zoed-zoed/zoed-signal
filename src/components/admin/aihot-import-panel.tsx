"use client";

import { useState, useTransition } from "react";

type ImportResponse = {
  briefId: string;
  briefTitle: string;
  fetchedCount: number;
  importedCount: number;
  skippedCount: number;
  mode: "selected" | "all";
  since: number;
};

export function AiHotImportPanel() {
  const [mode, setMode] = useState<"selected" | "all">("selected");
  const [since, setSince] = useState("3");
  const [message, setMessage] = useState<string>();
  const [previewCount, setPreviewCount] = useState<number>();
  const [isPending, startTransition] = useTransition();

  const handlePreview = () => {
    startTransition(async () => {
      setMessage(undefined);
      const response = await fetch(`/api/sources/aihot/items?mode=${mode}&since=${since}`, {
        method: "GET",
      });
      const data = (await response.json()) as { count?: number; message?: string };

      if (!response.ok) {
        setPreviewCount(undefined);
        setMessage(data.message ?? "预览 AI HOT 内容失败。");
        return;
      }

      setPreviewCount(data.count ?? 0);
      setMessage(`预览完成：当前条件下可拿到 ${data.count ?? 0} 条候选内容。`);
    });
  };

  const handleImport = () => {
    startTransition(async () => {
      setMessage(undefined);
      const response = await fetch(`/api/sources/aihot/import?mode=${mode}&since=${since}`, {
        method: "POST",
      });
      const data = (await response.json()) as Partial<ImportResponse> & { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "导入 AI HOT 内容失败。");
        return;
      }

      setMessage(
        `已导入 ${data.importedCount ?? 0} 条内容到 ${data.briefTitle ?? "今日简报"}（briefId: ${data.briefId ?? "-" }）。`,
      );
    });
  };

  return (
    <article className="glass-panel rounded-[36px] p-7 md:p-9">
      <p className="section-label">AI HOT P0 Source</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">导入 AI HOT 作为临时试运行信源</h2>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        这一步会从 AI HOT 拉取候选内容，按当前的 P0 规则映射到你的新闻结构，再写进你自己的库里，而不是前台现查现用。
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as "selected" | "all")}
          className="min-h-11 rounded-[18px] border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--foreground)] outline-none"
        >
          <option value="selected">精选池 selected</option>
          <option value="all">全量池 all</option>
        </select>

        <input
          type="number"
          min={1}
          max={14}
          value={since}
          onChange={(event) => setSince(event.target.value)}
          className="min-h-11 rounded-[18px] border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--foreground)] outline-none"
        />

        <button
          type="button"
          onClick={handlePreview}
          disabled={isPending}
          className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--foreground)] disabled:opacity-60"
        >
          {isPending ? "处理中..." : "先预览数量"}
        </button>

        <button
          type="button"
          onClick={handleImport}
          disabled={isPending}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {isPending ? "导入中..." : "导入到我的库"}
        </button>
      </div>

      <div className="mt-4 text-sm leading-7 text-[var(--muted)]">
        <p>当前默认策略：拉取最近 3 天的 AI HOT 精选内容，导入后自动挂到当天的 AI HOT brief 下。</p>
        {previewCount !== undefined ? <p className="mt-2">预览数量：{previewCount} 条。</p> : null}
        {message ? <p className="mt-2 text-[var(--foreground)]">{message}</p> : null}
      </div>
    </article>
  );
}
