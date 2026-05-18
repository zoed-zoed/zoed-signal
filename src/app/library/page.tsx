import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { getBookmarks } from "@/lib/data/bookmarks";
import { getNewsItems } from "@/lib/data/news";
import { formatDate, labelSavedType } from "@/lib/utils/format";
import type { SavedType } from "@/types/news";

const buckets: SavedType[] = ["interview", "case", "content", "research"];

export default async function LibraryPage() {
  const [bookmarks, items] = await Promise.all([getBookmarks(), getNewsItems({ onlyPublished: true })]);
  const itemMap = new Map(items.map((item) => [item.id, item]));

  return (
    <SiteShell activeNav="library">
      <section className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="section-icon">
            <LibraryHeaderIcon />
          </span>
          <div>
            <h1 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--midnight)]">收藏夹</h1>
            <p className="mt-2 text-lg text-[var(--muted)]">按用途整理你已经存下来的新闻素材，先快速扫一眼，再按需点进去细看。</p>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        {buckets.map((bucket) => {
          const matches = bookmarks
            .filter((bookmark) => bookmark.bucket === bucket)
            .map((bookmark) => ({
              bookmark,
              item: itemMap.get(bookmark.newsId),
            }))
            .filter((entry) => entry.item);

          const previews = matches.slice(0, 2);
          const latestBookmark = matches[0]?.bookmark;

          return (
            <Link
              key={bucket}
              href={`/library/${bucket}`}
              className="group rounded-[34px] border border-[var(--line-strong)] bg-[rgba(255,255,255,0.78)] p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(32,46,77,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--midnight)]">{labelSavedType(bucket)}</h2>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
                    <span>{matches.length} 条收藏</span>
                    <span>{latestBookmark ? `最近更新于 ${formatDate(latestBookmark.createdAt)}` : "还没有内容"}</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-[var(--midnight)] transition group-hover:text-[var(--accent-strong)]">进入详情 ↗</span>
              </div>

              <div className="mt-6 space-y-3">
                {previews.length ? (
                  previews.map(({ item }) => (
                    <div key={item!.id} className="rounded-[22px] border border-[var(--line)] bg-white px-4 py-4">
                      <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                        <span className="rounded-full bg-[var(--sage-soft)] px-3 py-1 text-[var(--success)]">{item!.category}</span>
                      </div>
                      <h3 className="mt-3 text-[1.45rem] font-semibold leading-[1.25] text-[var(--midnight)]">{item!.title}</h3>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.58)] px-4 py-5 text-sm leading-7 text-[var(--muted)]">
                    这个分类里还没有内容。去简报详情里点一下收藏，这里就会开始出现可复用的新闻素材。
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </section>
    </SiteShell>
  );
}

function LibraryHeaderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4.5H18A1 1 0 0 1 19 5.5V19.5L12 16.4L5 19.5V5.5A1 1 0 0 1 6 4.5Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
