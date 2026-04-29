"use client";

import { useMemo, useState, useTransition } from "react";

import { labelSavedType } from "@/lib/utils/format";
import type { SavedType } from "@/types/news";

const savedTypes: SavedType[] = ["interview", "case", "content", "research"];

type BookmarkControlsProps = {
  newsId: string;
  initialSavedTypes: SavedType[];
};

export function BookmarkControls({ newsId, initialSavedTypes }: BookmarkControlsProps) {
  const [saved, setSaved] = useState<SavedType[]>(initialSavedTypes);
  const [isPending, startTransition] = useTransition();

  const savedSet = useMemo(() => new Set(saved), [saved]);

  function toggleBookmark(bucket: SavedType) {
    startTransition(async () => {
      const active = savedSet.has(bucket);
      const method = active ? "DELETE" : "POST";
      const response = await fetch(`/api/bookmarks${active ? `/${newsId}?bucket=${bucket}` : ""}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: active ? undefined : JSON.stringify({ newsId, bucket }),
      });

      if (!response.ok) {
        return;
      }

      setSaved((current) =>
        active ? current.filter((item) => item !== bucket) : [...current, bucket],
      );
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[var(--foreground)]">加入素材库</p>
        {isPending ? <span className="text-xs text-[var(--muted)]">保存中...</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {savedTypes.map((bucket) => {
          const active = savedSet.has(bucket);
          return (
            <button
              key={bucket}
              type="button"
              onClick={() => toggleBookmark(bucket)}
              className={`rounded-full border px-3 py-2 text-sm transition ${
                active
                  ? "border-[rgba(202,93,52,0.28)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "border-[var(--line)] bg-white/70 text-[var(--muted)] hover:border-[rgba(202,93,52,0.2)] hover:text-[var(--foreground)]"
              }`}
            >
              {labelSavedType(bucket)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
