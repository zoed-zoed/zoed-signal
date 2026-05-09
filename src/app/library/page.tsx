import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { getBookmarks } from "@/lib/data/bookmarks";
import { getNewsItems } from "@/lib/data/news";
import { labelSavedType } from "@/lib/utils/format";
import type { SavedType } from "@/types/news";

const buckets: SavedType[] = ["interview", "case", "content", "research"];

export default async function LibraryPage() {
  const [bookmarks, items] = await Promise.all([getBookmarks(), getNewsItems({ onlyPublished: true })]);
  const itemMap = new Map(items.map((item) => [item.id, item]));

  return (
    <SiteShell>
      <section className="glass-panel rounded-[40px] p-7 md:p-10">
        <p className="section-label">Saved library</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">把新闻沉淀成长期可复用的素材库</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          第一版先按用途分类收藏：面试谈资、商赛素材、文章选题和行业研究。后面如果你觉得好用，我们再把它扩展成真正的个人知识库。
        </p>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        {buckets.map((bucket) => {
          const matches = bookmarks
            .filter((bookmark) => bookmark.bucket === bucket)
            .map((bookmark) => itemMap.get(bookmark.newsId))
            .filter(Boolean);

          return (
            <article key={bucket} className="glass-panel rounded-[30px] p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">{labelSavedType(bucket)}</h2>
                <span className="chip">{matches.length} 条</span>
              </div>

              <div className="mt-5 space-y-3">
                {matches.length ? (
                  matches.map((item) => (
                    <Link
                      key={item!.id}
                      href={`/briefs/${item!.briefId}`}
                      className="block rounded-[22px] border border-[var(--line)] bg-white/72 p-4 transition hover:-translate-y-0.5"
                    >
                      <p className="text-sm text-[var(--muted)]">{item!.category}</p>
                      <p className="mt-2 text-lg font-semibold">{item!.title}</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item!.interviewOrCaseUse}</p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-white/55 p-5 text-sm leading-7 text-[var(--muted)]">
                    这个分类里还没有收藏内容。去简报详情页点一下“加入素材库”，就能把一条新闻沉淀成长期可复用的资产。
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
