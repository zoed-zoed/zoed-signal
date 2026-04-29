"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import type { Brief } from "@/types/brief";

type BriefEditorFormProps = {
  initialData?: Brief;
  linkedNewsCount?: number;
};

type FormState = {
  issueNumber: string;
  date: string;
  intro: string;
  tags: string;
  coreTrend: string;
  studentInsight: string;
  contentIdeas: string;
  resumePortfolioNote: string;
};

export function BriefEditorForm({ initialData, linkedNewsCount = 0 }: BriefEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const initialState = useMemo<FormState>(
    () => ({
      issueNumber: extractIssueNumber(initialData),
      date: initialData?.date ?? new Date().toISOString().slice(0, 10),
      intro: initialData?.intro ?? "",
      tags: initialData?.tags.join("，") ?? "",
      coreTrend: initialData?.coreTrend ?? "",
      studentInsight: initialData?.studentInsight ?? "",
      contentIdeas: initialData?.contentIdeas ?? "",
      resumePortfolioNote: initialData?.resumePortfolioNote ?? "",
    }),
    [initialData],
  );

  const [form, setForm] = useState<FormState>(initialState);

  const issueNumber = form.issueNumber.trim();
  const previewTitle = issueNumber ? `Vol.${issueNumber} 简报` : "Vol.新一期 简报";
  const previewId = issueNumber ? `vol-${issueNumber}` : "vol-new";

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      setError("");

      if (!issueNumber) {
        setError("请先填写简报期数，例如 4。");
        return;
      }

      const payload: Brief = {
        id: initialData?.id ?? previewId,
        title: initialData?.title ?? previewTitle,
        date: form.date,
        intro: form.intro,
        tags: form.tags
          .split(/[，,]/)
          .map((item) => item.trim())
          .filter(Boolean),
        coreTrend: form.coreTrend,
        studentInsight: form.studentInsight,
        contentIdeas: form.contentIdeas,
        resumePortfolioNote: form.resumePortfolioNote,
        newsItemIds: initialData?.newsItemIds ?? [],
      };

      const response = await fetch(`/api/briefs${initialData ? `/${initialData.id}` : ""}`, {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? "保存失败，请检查必填项后重试。");
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  }

  function remove() {
    if (!initialData) {
      return;
    }

    startTransition(async () => {
      setError("");
      const response = await fetch(`/api/briefs/${initialData.id}`, { method: "DELETE" });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? "删除失败，请稍后再试。");
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="简报期数">
          <input
            value={form.issueNumber}
            disabled={Boolean(initialData)}
            onChange={(event) => update("issueNumber", event.target.value.replace(/[^\d]/g, ""))}
            className={inputClassName}
            placeholder="例如 4"
          />
        </Field>
        <Field label="发布日期">
          <input
            value={form.date}
            type="date"
            onChange={(event) => update("date", event.target.value)}
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="rounded-[24px] border border-[var(--line)] bg-white/72 p-5">
        <p className="text-sm font-medium text-[var(--foreground)]">系统生成的标题和链接标识</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">标题</p>
            <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
              {initialData?.title ?? previewTitle}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">ID / URL</p>
            <p className="mt-2 text-base font-semibold text-[var(--foreground)]">
              {initialData?.id ?? previewId}
            </p>
          </div>
        </div>
        {initialData ? (
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            为了不影响已经归属到这期简报的新闻，编辑模式下不允许修改期数和 ID。当前关联新闻数量：{linkedNewsCount} 条。
          </p>
        ) : (
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            新建时会自动生成 `Vol.x 简报` 和 `vol-x`，这样后面给新闻分配所属简报时会更稳定。
          </p>
        )}
      </div>

      <Field label="本期简介">
        <textarea
          rows={4}
          value={form.intro}
          onChange={(event) => update("intro", event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field label="标签（用中文逗号或英文逗号分隔）">
        <input
          value={form.tags}
          onChange={(event) => update("tags", event.target.value)}
          className={inputClassName}
          placeholder="例如 AI，商业科技，求职"
        />
      </Field>

      <Field label="本期核心趋势">
        <textarea
          rows={3}
          value={form.coreTrend}
          onChange={(event) => update("coreTrend", event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field label="给商科学生的启发">
        <textarea
          rows={3}
          value={form.studentInsight}
          onChange={(event) => update("studentInsight", event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field label="可延展成的内容 / 选题">
        <textarea
          rows={3}
          value={form.contentIdeas}
          onChange={(event) => update("contentIdeas", event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field label="适合沉淀成什么作品">
        <textarea
          rows={3}
          value={form.resumePortfolioNote}
          onChange={(event) => update("resumePortfolioNote", event.target.value)}
          className={inputClassName}
        />
      </Field>

      {error ? <p className="text-sm text-[var(--accent-strong)]">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="rounded-full bg-[var(--accent)] px-5 py-3 font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "保存中..." : initialData ? "更新简报" : "保存简报"}
        </button>

        {initialData ? (
          <button
            type="button"
            disabled={isPending || linkedNewsCount > 0}
            onClick={remove}
            className="rounded-full border border-[var(--line)] bg-white/75 px-5 py-3 text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            删除简报
          </button>
        ) : null}
      </div>

      {initialData && linkedNewsCount > 0 ? (
        <p className="text-sm leading-7 text-[var(--muted)]">
          这期简报下还有 {linkedNewsCount} 条新闻，所以暂时不能直接删除。先把这些新闻改到别的简报，或者删掉新闻本身，再回来删除这期简报。
        </p>
      ) : null}
    </div>
  );
}

function extractIssueNumber(initialData?: Brief) {
  if (!initialData) {
    return "";
  }

  const match = initialData.id.match(/vol-(\d+)/i) ?? initialData.title.match(/Vol\.(\d+)/i);
  return match?.[1] ?? "";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "min-h-12 w-full rounded-[22px] border border-[var(--line)] bg-white/78 px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[rgba(202,93,52,0.28)] focus:ring-4 focus:ring-[rgba(202,93,52,0.12)]";
