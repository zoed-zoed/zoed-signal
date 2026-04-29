import Link from "next/link";

import { SiteShell } from "@/components/layout/site-shell";
import { getBriefs } from "@/lib/data/briefs";
import { getNewsItems } from "@/lib/data/news";
import { formatDate } from "@/lib/utils/format";
import { IMPORTANCE_OPTIONS, NEWS_CATEGORY_OPTIONS } from "@/types/news";

type AdminPageProps = {
  searchParams?: Promise<{
    briefId?: string;
    category?: string;
    importance?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [briefs, items] = await Promise.all([getBriefs(), getNewsItems()]);
  const filters = (await searchParams) ?? {};
  const briefMap = new Map(briefs.map((brief) => [brief.id, brief.title]));
  const newsCountByBrief = new Map<string, number>();

  for (const item of items) {
    newsCountByBrief.set(item.briefId, (newsCountByBrief.get(item.briefId) ?? 0) + 1);
  }

  const filteredItems = items.filter((item) => {
    if (filters.briefId && item.briefId !== filters.briefId) {
      return false;
    }
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    if (filters.importance && item.importance !== filters.importance) {
      return false;
    }
    return true;
  });

  return (
    <SiteShell>
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="glass-panel rounded-[36px] p-7 md:p-9">
          <p className="section-label">Admin</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">手动维护新闻内容，先把质量做扎实</h1>
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
            第一版先以人工编辑为主：你来判断哪些新闻值得进简报、应该放在哪一期、要怎么解释给商科学生看懂。
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/admin/news/new"
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]"
            >
              新增新闻
            </Link>
            <Link
              href="/admin/briefs/new"
              className="rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm text-[var(--foreground)] transition hover:border-[rgba(202,93,52,0.24)]"
            >
              新增简报
            </Link>
            <Link
              href="/library"
              className="rounded-full border border-[var(--line)] px-5 py-3 text-sm text-[var(--foreground)]"
            >
              查看素材库
            </Link>
          </div>
        </article>

        <article className="glass-panel rounded-[36px] p-7 md:p-9">
          <p className="section-label">Current briefs</p>
          <div className="mt-4 space-y-4">
            {briefs.map((brief) => (
              <div key={brief.id} className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{brief.title}</p>
                    <p className="text-sm text-[var(--muted)]">{formatDate(brief.date)}</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">已归档 {newsCountByBrief.get(brief.id) ?? 0} 条新闻</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <Link href={`/briefs/${brief.id}`} className="text-[var(--accent-strong)]">
                      打开
                    </Link>
                    <Link href={`/admin/briefs/${brief.id}/edit`} className="text-[var(--foreground)]">
                      编辑简报
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="section-label">News inventory</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">现有新闻条目</h2>
          </div>
          <p className="text-sm text-[var(--muted)]">点击编辑，可以直接修改卡片内容和字段。当前显示 {filteredItems.length} 条。</p>
        </div>

        <form className="mb-5 grid gap-3 rounded-[24px] border border-[var(--line)] bg-white/70 p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <select
            name="briefId"
            defaultValue={filters.briefId ?? ""}
            className="min-h-11 rounded-[18px] border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--foreground)] outline-none"
          >
            <option value="">全部简报</option>
            {briefs.map((brief) => (
              <option key={brief.id} value={brief.id}>
                {brief.title}
              </option>
            ))}
          </select>

          <select
            name="category"
            defaultValue={filters.category ?? ""}
            className="min-h-11 rounded-[18px] border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--foreground)] outline-none"
          >
            <option value="">全部分类</option>
            {NEWS_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            name="importance"
            defaultValue={filters.importance ?? ""}
            className="min-h-11 rounded-[18px] border border-[var(--line)] bg-white px-4 py-2 text-sm text-[var(--foreground)] outline-none"
          >
            <option value="">全部重要程度</option>
            {IMPORTANCE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-full bg-[var(--charcoal)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
          >
            应用筛选
          </button>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--foreground)]"
          >
            清空
          </Link>
        </form>

        <div className="grid gap-4">
          {filteredItems.length ? filteredItems.map((item) => (
            <article key={item.id} className="glass-panel rounded-[28px] p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className={`chip ${item.importance === "必看" ? "importance-must" : "importance-scan"}`}>
                      {item.importance}
                    </span>
                    <span className="chip">{item.category}</span>
                    <span className="chip">{briefMap.get(item.briefId)}</span>
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="text-sm leading-7 text-[var(--muted)]">{item.whatHappened}</p>
                </div>

                <Link
                  href={`/admin/news/${item.id}/edit`}
                  className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--foreground)]"
                >
                  编辑
                </Link>
              </div>
            </article>
          )) : (
            <div className="glass-panel rounded-[28px] p-6 text-sm leading-7 text-[var(--muted)]">
              当前筛选条件下没有匹配的新闻。你可以换一个简报、分类或重要程度，或者点“清空”回到全部列表。
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
