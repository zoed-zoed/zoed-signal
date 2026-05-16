import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { getBookmarks } from "@/lib/data/bookmarks";
import { getNewsItems } from "@/lib/data/news";
import { formatDate } from "@/lib/utils/format";
import { labelSavedType } from "@/lib/utils/format";
import type { SavedType } from "@/types/news";

const buckets: SavedType[] = ["interview", "case", "content", "research"];

export default async function LibraryPage() {
  const [bookmarks, items] = await Promise.all([getBookmarks(), getNewsItems({ onlyPublished: true })]);
  const itemMap = new Map(items.map((item) => [item.id, item]));

  return (
    <SiteShell activeNav="library">
      <section className="rounded-[42px] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] px-7 py-8 md:px-10 md:py-10">
        <p className="section-label">Saved library</p>
        <h1 className="mt-4 text-[3.3rem] font-semibold tracking-[-0.06em] text-[var(--midnight)] md:text-[4.3rem]">
          把值得重复使用的新闻，沉淀成你的长期素材库
        </h1>
        <p className="mt-5 max-w-3xl text-[1.15rem] leading-8 text-[var(--slate)]">
          这里保留你已经挑出来的面试谈资、商赛案例、文章选题和行业研究。以后每一期简报都不只是读完，而是会变成可以继续调用的资产。
        </p>
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

          return (
            <article key={bucket} className="rounded-[34px] border border-[var(--line-strong)] bg-[rgba(255,255,255,0.78)] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-label">Collection</p>
                  <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--midnight)]">{labelSavedType(bucket)}</h2>
                </div>
                <span className="signal-chip chip">{matches.length} 条</span>
              </div>

              <div className="mt-6 space-y-4">
                {matches.length ? (
                  matches.map(({ bookmark, item }) => (
                    <Link
                      key={`${bucket}-${item!.id}`}
                      href={`/briefs/${item!.briefId}`}
                      className="group block rounded-[28px] border border-[var(--line)] bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(32,46,77,0.06)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
                        <span className="rounded-full bg-[var(--sage-soft)] px-3 py-1 text-[var(--success)]">{item!.category}</span>
                        <span>收藏于 {formatDate(bookmark.createdAt)}</span>
                      </div>
                      <h3 className="mt-4 text-[2rem] font-semibold leading-[1.18] tracking-[-0.05em] text-[var(--midnight)]">
                        {item!.title}
                      </h3>
                      <p className="mt-4 text-base leading-8 text-[var(--muted)]">{item!.interviewOrCaseUse}</p>
                      <p className="mt-5 text-sm font-medium text-[var(--midnight)] transition group-hover:text-[var(--accent-strong)]">
                        回到原简报继续查看 →
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[28px] border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.58)] px-5 py-6 text-sm leading-7 text-[var(--muted)]">
                    这个分类里还没有内容。去简报详情里点一下“加入素材库”，这里就会开始积累可长期复用的文章。
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </SiteShell>
  );
}
