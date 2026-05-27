import Link from "next/link";

import { BriefCard } from "@/components/brief/brief-card";
import { SiteShell } from "@/components/layout/site-shell";
import { getBriefs } from "@/lib/data/briefs";
import { getNewsItems } from "@/lib/data/news";
import { formatDate, formatRelativeHours } from "@/lib/utils/format";

type HomePageProps = {
  searchParams?: Promise<{
    order?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const [briefs, items] = await Promise.all([getBriefs(), getNewsItems({ onlyPublished: true })]);
  const params = (await searchParams) ?? {};
  const sortOrder = params.order === "asc" ? "asc" : "desc";
  const todayLabel = formatDate(new Date().toISOString());
  const newsCountByBrief = new Map<string, number>();

  for (const item of items) {
    newsCountByBrief.set(item.briefId, (newsCountByBrief.get(item.briefId) ?? 0) + 1);
  }

  const visibleBriefs = briefs.filter((brief) => (newsCountByBrief.get(brief.id) ?? 0) > 0);
  const latestBrief = visibleBriefs[0];
  const currentSignals = latestBrief ? items.filter((item) => item.briefId === latestBrief.id).slice(0, 3) : [];
  const displayBriefs = sortOrder === "asc" ? [...visibleBriefs].reverse() : visibleBriefs;

  return (
    <SiteShell activeNav="home">
      <section className="fade-rise relative overflow-hidden rounded-[44px] border border-[var(--line)] bg-[rgba(255,255,255,0.62)] px-7 py-9 shadow-[0_28px_80px_rgba(32,46,77,0.06)] md:px-12 md:py-14">
        <div className="hero-orbit left-[-80px] top-16 h-[220px] w-[220px]" />
        <div className="hero-orbit right-[-30px] top-10 h-[180px] w-[180px]" />

        <div className="relative">
          <span className="signal-chip chip">每日简报 · {todayLabel}</span>
          <h1 className="mt-8 max-w-5xl text-balance text-[3.45rem] font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--midnight)] md:text-[5.7rem]">
            科技商业新闻，
            <br />
            为清晰决策而筛选
          </h1>
          <p className="mt-5 max-w-2xl text-[0.98rem] leading-[1.85] text-[var(--slate)] md:text-[1.04rem]">
            将 AI、科技与商业信号提炼成聚焦的每日洞察，帮你更快看清值得继续跟进的公司动作、市场变化与职业线索。
          </p>
        </div>
      </section>

      <section className="fade-rise mt-12 rounded-[36px] border border-[var(--line)] bg-[rgba(255,255,255,0.74)] px-7 py-7 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-label">本期你会看到什么</p>
            <h2 className="mt-3 max-w-3xl text-[2.05rem] font-medium tracking-[-0.04em] text-[var(--midnight)] md:text-[2.25rem]">
              从编辑部视角筛出的 3 条重点信号
            </h2>
          </div>
          {latestBrief ? (
            <Link
              href={`/briefs/${latestBrief.id}`}
              className="inline-flex items-center gap-2 text-base font-medium text-[var(--midnight)] transition hover:text-[var(--accent-strong)]"
            >
              进入本期简报
              <span aria-hidden="true">↗</span>
            </Link>
          ) : null}
        </div>

        <div className="stagger-list mt-6 grid gap-5 lg:grid-cols-3">
          {currentSignals.length ? (
            currentSignals.map((item) => (
              <Link
                key={item.id}
                href={`/briefs/${item.briefId}`}
                className="interactive-card group rounded-[24px] border border-[var(--line-strong)] bg-white px-6 py-6"
              >
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                  <span>{formatRelativeHours(item.publishedAt)}</span>
                  <span className="rounded-full bg-[var(--sage-soft)] px-3 py-1 font-medium text-[var(--success)]">{item.category}</span>
                </div>
                <h3 className="mt-5 text-[1.62rem] font-medium leading-[1.32] tracking-[-0.03em] text-[var(--midnight)]">
                  {item.title}
                </h3>
                <p className="mt-4 line-clamp-3 text-[0.94rem] leading-7 text-[var(--muted)]">{item.whatHappened}</p>
              </Link>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-[var(--line)] px-5 py-6 text-sm leading-7 text-[var(--muted)] lg:col-span-3">
              当前还没有可展示的本期重点。等导入完成后，这里会自动出现 3 条可点击查看的新闻入口。
            </div>
          )}
        </div>
      </section>

      <section id="today-headlines" className="fade-rise mt-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="section-icon">
              <HeadlineIcon />
            </span>
            <h2 className="text-[2.6rem] font-medium tracking-[-0.05em] text-[var(--midnight)]">今日头条</h2>
          </div>
          <div className="hidden items-center gap-3 text-sm text-[var(--muted)] md:flex">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
              实时 · 5 分钟前更新
            </span>
          </div>
        </div>

        <div className="stagger-list grid gap-5 lg:grid-cols-3">
          {currentSignals.map((item) => (
            <Link
              key={item.id}
              href={`/briefs/${item.briefId}`}
              className="interactive-card group rounded-[24px] border border-[var(--line-strong)] bg-white px-7 py-7"
            >
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                <span className="rounded-full bg-[var(--sage)] px-3 py-1 font-medium text-white">{item.category}</span>
                <span>{formatRelativeHours(item.publishedAt)}</span>
              </div>
              <h3 className="mt-6 text-[1.8rem] font-medium leading-[1.28] tracking-[-0.03em] text-[var(--midnight)]">{item.title}</h3>
              <p className="mt-4 line-clamp-3 text-[0.94rem] leading-7 text-[var(--muted)]">{item.whatHappened}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="fade-rise mt-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="section-icon">
              <ArchiveIcon />
            </span>
            <h2 className="text-[2.6rem] font-medium tracking-[-0.05em] text-[var(--midnight)]">简报归档</h2>
          </div>

          <div className="rounded-full border border-[var(--line-strong)] bg-[rgba(255,255,255,0.85)] p-1">
            <div className="flex items-center gap-1 text-sm">
              <Link
                href="/?order=desc#archive"
                className={`nav-link rounded-full px-4 py-2.5 ${
                  sortOrder === "desc" ? "bg-[var(--midnight)] text-white" : "text-[var(--muted)] hover:text-[var(--midnight)]"
                }`}
              >
                最新
              </Link>
              <Link
                href="/?order=asc#archive"
                className={`nav-link rounded-full px-4 py-2.5 ${
                  sortOrder === "asc" ? "bg-[var(--midnight)] text-white" : "text-[var(--muted)] hover:text-[var(--midnight)]"
                }`}
              >
                最早
              </Link>
            </div>
          </div>
        </div>

        <div id="archive" className="stagger-list grid gap-5">
          {displayBriefs.map((brief) => (
            <BriefCard key={brief.id} brief={brief} newsCount={newsCountByBrief.get(brief.id) ?? 0} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function HeadlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5H9V19H5V5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 9H16V19H12V9Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M19 3H23V19H19V3Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 8L10 13L19 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 12V19H5V12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
