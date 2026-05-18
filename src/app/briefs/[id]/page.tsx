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
    <SiteShell activeNav="news">
      <section className="rounded-[42px] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] px-7 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <span className="signal-chip chip">{formatDate(brief.date)}</span>
          <span>{items.length} 条新闻</span>
        </div>

        <div className="mt-6 space-y-6">
          <h1 className="max-w-5xl text-balance text-[3.3rem] font-semibold leading-[1.02] tracking-[-0.06em] text-[var(--midnight)] md:text-[4.5rem]">
            {brief.title}
          </h1>

          <article className="max-w-3xl rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6">
            <p className="section-label">本期速览</p>
            <div className="mt-5 space-y-5 text-sm leading-7 text-[var(--muted)]">
              <div>
                <p className="font-medium text-[var(--midnight)]">本期核心趋势</p>
                <p className="mt-2">{brief.coreTrend ?? "本期聚焦 AI、公司战略和市场信号的交叉变化。"}</p>
              </div>
              <div>
                <p className="font-medium text-[var(--midnight)]">对商科学生的价值</p>
                <p className="mt-2">{brief.studentInsight ?? "优先把新闻转成你自己的商业判断、行业认知和面试表达。"}</p>
              </div>
              <div>
                <p className="font-medium text-[var(--midnight)]">如何继续利用</p>
                <p className="mt-2">{brief.resumePortfolioNote ?? "把其中 1 到 2 条整理成素材卡片，后续用于面试、写作或商赛。"}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/library"
                className="rounded-full bg-[var(--midnight)] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--midnight-soft)]"
              >
                去收藏夹整理
              </Link>
              <Link
                href="/"
                className="rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm text-[var(--foreground)] transition hover:bg-white"
              >
                返回首页
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="mt-10 space-y-6">
        {items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </section>
    </SiteShell>
  );
}
