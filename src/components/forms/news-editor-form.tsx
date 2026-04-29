"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import type { Brief } from "@/types/brief";
import {
  IMPORTANCE_OPTIONS,
  NEWS_CATEGORY_OPTIONS,
  type Importance,
  type NewsCategory,
  type NewsItem,
} from "@/types/news";

type NewsEditorFormProps = {
  briefs: Brief[];
  initialData?: NewsItem;
};

type FormState = {
  briefId: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  category: NewsCategory;
  importance: Importance;
  whatHappened: string;
  whyImportant: string;
  relevanceToBusinessStudents: string;
  interviewOrCaseUse: string;
  nextAction: string;
  tags: string;
};

export function NewsEditorForm({ briefs, initialData }: NewsEditorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const initialState = useMemo<FormState>(
    () => ({
      briefId: initialData?.briefId ?? briefs[0]?.id ?? "",
      title: initialData?.title ?? "",
      sourceName: initialData?.sourceName ?? "",
      sourceUrl: initialData?.sourceUrl ?? "",
      publishedAt: initialData?.publishedAt ?? new Date().toISOString().slice(0, 10),
      category: initialData?.category ?? "AI 产品更新",
      importance: initialData?.importance ?? "必看",
      whatHappened: initialData?.whatHappened ?? "",
      whyImportant: initialData?.whyImportant ?? "",
      relevanceToBusinessStudents: initialData?.relevanceToBusinessStudents ?? "",
      interviewOrCaseUse: initialData?.interviewOrCaseUse ?? "",
      nextAction: initialData?.nextAction ?? "",
      tags: initialData?.tags.join("，") ?? "",
    }),
    [briefs, initialData],
  );

  const [form, setForm] = useState<FormState>(initialState);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      setError("");

      if (!briefs.length) {
        setError("请先去后台新增一期简报，再录入新闻。");
        return;
      }

      const payload: NewsItem = {
        id: initialData?.id ?? crypto.randomUUID(),
        briefId: form.briefId,
        title: form.title,
        sourceName: form.sourceName,
        sourceUrl: form.sourceUrl,
        publishedAt: form.publishedAt,
        category: form.category,
        importance: form.importance,
        whatHappened: form.whatHappened,
        whyImportant: form.whyImportant,
        relevanceToBusinessStudents: form.relevanceToBusinessStudents,
        interviewOrCaseUse: form.interviewOrCaseUse,
        nextAction: form.nextAction,
        tags: form.tags
          .split(/[，,]/)
          .map((item) => item.trim())
          .filter(Boolean),
        savedType: initialData?.savedType ?? [],
      };

      const response = await fetch(`/api/news${initialData ? `/${initialData.id}` : ""}`, {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setError("保存失败，请检查必填项后重试。");
        return;
      }

      router.push(`/briefs/${payload.briefId}`);
      router.refresh();
    });
  }

  function remove() {
    if (!initialData) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/news/${initialData.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("删除失败，请稍后再试。");
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {!briefs.length ? (
        <div className="rounded-[24px] border border-[rgba(202,93,52,0.2)] bg-[var(--accent-soft)] p-5 text-sm leading-7 text-[var(--accent-strong)]">
          你现在还没有创建任何简报。先去后台新增一期简报，新闻才能正确归档到 `Vol.1 / Vol.2 / Vol.3`
          这类期数里。
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="所属简报期数">
          <select
            value={form.briefId}
            onChange={(event) => update("briefId", event.target.value)}
            className={inputClassName}
          >
            {briefs.map((brief) => (
              <option key={brief.id} value={brief.id}>
                {brief.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="发布时间">
          <input
            value={form.publishedAt}
            type="date"
            onChange={(event) => update("publishedAt", event.target.value)}
            className={inputClassName}
          />
        </Field>
      </div>

      <Field label="新闻标题">
        <input
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          className={inputClassName}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="来源名称">
          <input
            value={form.sourceName}
            onChange={(event) => update("sourceName", event.target.value)}
            className={inputClassName}
          />
        </Field>
        <Field label="原文链接">
          <input
            value={form.sourceUrl}
            onChange={(event) => update("sourceUrl", event.target.value)}
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="新闻分类">
          <select
            value={form.category}
            onChange={(event) => update("category", event.target.value as NewsCategory)}
            className={inputClassName}
          >
            {NEWS_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="重要程度">
          <select
            value={form.importance}
            onChange={(event) => update("importance", event.target.value as Importance)}
            className={inputClassName}
          >
            {IMPORTANCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="发生了什么">
        <textarea
          rows={4}
          value={form.whatHappened}
          onChange={(event) => update("whatHappened", event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field label="为什么重要">
        <textarea
          rows={4}
          value={form.whyImportant}
          onChange={(event) => update("whyImportant", event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field label="和商科生的关系">
        <textarea
          rows={4}
          value={form.relevanceToBusinessStudents}
          onChange={(event) => update("relevanceToBusinessStudents", event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field label="可以怎么用于面试 / 商赛">
        <textarea
          rows={4}
          value={form.interviewOrCaseUse}
          onChange={(event) => update("interviewOrCaseUse", event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field label="下一步行动建议">
        <textarea
          rows={3}
          value={form.nextAction}
          onChange={(event) => update("nextAction", event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field label="关键词标签（用中文逗号或英文逗号分隔）">
        <input
          value={form.tags}
          onChange={(event) => update("tags", event.target.value)}
          className={inputClassName}
        />
      </Field>

      {error ? <p className="text-sm text-[var(--accent-strong)]">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isPending || !briefs.length}
          onClick={submit}
          className="rounded-full bg-[var(--accent)] px-5 py-3 font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "保存中..." : initialData ? "更新新闻" : "保存新闻"}
        </button>

        {initialData ? (
          <button
            type="button"
            disabled={isPending}
            onClick={remove}
            className="rounded-full border border-[var(--line)] bg-white/75 px-5 py-3 text-[var(--muted)] transition hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            删除新闻
          </button>
        ) : null}
      </div>
    </div>
  );
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
