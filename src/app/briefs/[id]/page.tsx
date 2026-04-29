import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteShell } from "@/components/layout/site-shell";
import { NewsCard } from "@/components/news/news-card";
import { getBriefById } from "@/lib/data/briefs";
import { getNewsForBrief } from "@/lib/data/news";
import { formatDate } from "@/lib/utils/format";

type BriefDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BriefDetailPage({ params }: BriefDetailPageProps) {
  const { id } = await params;
  const brief = await getBriefById(id);

  if (!brief) {
    notFound();
  }

  const items = await getNewsForBrief(id);

  return (
    <SiteShell>
      <section className="glass-panel rounded-[40px] p-7 md:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="section-label">Brief Detail</span>
          <span className="chip">{formatDate(brief.date)}</span>
          <span className="chip">{items.length} 条新闻</span>
        </div>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          {brief.title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">{brief.intro}</p>

        <div className="mt-7 flex flex-wrap gap-2">
          {brief.tags.map((tag) => (
            <span className="chip" key={tag}>
              #{tag}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <SummaryCard title="本期核心趋势" content={brief.coreTrend} />
        <SummaryCard title="本期给商科生的启发" content={brief.studentInsight} />
        <SummaryCard title="适合沉淀成作品集的内容" content={brief.resumePortfolioNote} />
      </section>

      <section className="mt-10 space-y-6">
        {items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <SummaryCard title="本期适合延展的内容选题" content={brief.contentIdeas} />
        <article className="glass-panel rounded-[30px] p-6">
          <p className="section-label">Action</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">下一步建议</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
            <li>1. 从本期新闻里挑 1 条，写成 5 句话的个人判断。</li>
            <li>2. 把 1 条新闻加入素材库，归档到面试谈资或商赛素材。</li>
            <li>3. 试着把 1 条“必看”新闻扩写成一段可放进作品集的行业观察。</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/news/new"
              className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)]"
            >
              继续添加新闻
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--foreground)]"
            >
              返回首页
            </Link>
          </div>
        </article>
      </section>
    </SiteShell>
  );
}

function SummaryCard({ title, content }: { title: string; content?: string }) {
  return (
    <article className="glass-panel rounded-[28px] p-6">
      <p className="section-label">{title}</p>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{content ?? "暂未填写"}</p>
    </article>
  );
}
