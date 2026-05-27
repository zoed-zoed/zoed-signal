import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/layout/site-shell";
import { getBookmarks } from "@/lib/data/bookmarks";
import { getNewsItems } from "@/lib/data/news";
import { formatDate, labelSavedType } from "@/lib/utils/format";
import type { SavedType } from "@/types/news";

const buckets: SavedType[] = ["interview", "case", "content", "research"];

type LibraryBucketPageProps = {
  params: Promise<{ bucket: string }>;
};

export default async function LibraryBucketPage({ params }: LibraryBucketPageProps) {
  const { bucket } = await params;

  if (!buckets.includes(bucket as SavedType)) {
    notFound();
  }

  const [bookmarks, items] = await Promise.all([getBookmarks(), getNewsItems({ onlyPublished: true })]);
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const matches = bookmarks
    .filter((bookmark) => bookmark.bucket === bucket)
    .map((bookmark) => ({
      bookmark,
      item: itemMap.get(bookmark.newsId),
    }))
    .filter((entry) => entry.item);

  return (
    <SiteShell activeNav="library">
      <section className="fade-rise rounded-[42px] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] px-7 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
              <Link href="/library" className="transition hover:text-[var(--midnight)]">
                收藏夹
              </Link>
              <span>/</span>
              <span>{labelSavedType(bucket)}</span>
            </div>
            <h1 className="mt-4 text-[3rem] font-semibold tracking-[-0.06em] text-[var(--midnight)]">{labelSavedType(bucket)}</h1>
            <p className="mt-3 text-lg text-[var(--muted)]">这里会展示这个收藏分类下的完整文章列表，方便你集中回看和继续整理。</p>
          </div>
          <span className="signal-chip chip">{matches.length} 条内容</span>
        </div>
      </section>

      <section className="stagger-list mt-8 space-y-4">
        {matches.length ? (
          matches.map(({ bookmark, item }) => (
            <Link
              key={`${bookmark.newsId}-${bookmark.bucket}`}
              href={`/briefs/${item!.briefId}`}
              className="interactive-card group block rounded-[32px] border border-[var(--line-strong)] bg-white px-6 py-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[var(--sage-soft)] px-3 py-1 text-[var(--success)]">{item!.category}</span>
                  <span>收藏于 {formatDate(bookmark.createdAt)}</span>
                </div>
                <span>{formatDate(item!.publishedAt)}</span>
              </div>
              <h2 className="mt-4 text-[1.95rem] font-medium leading-[1.18] tracking-[-0.05em] text-[var(--midnight)]">{item!.title}</h2>
              <p className="mt-4 text-base leading-8 text-[var(--muted)]">{item!.interviewOrCaseUse}</p>
            </Link>
          ))
        ) : (
          <div className="rounded-[30px] border border-dashed border-[var(--line)] px-6 py-8 text-sm leading-7 text-[var(--muted)]">
            这个分类里还没有内容。去任意一篇简报里收藏文章，再回到这里查看完整列表。
          </div>
        )}
      </section>
    </SiteShell>
  );
}
