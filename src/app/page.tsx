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
      <section className="relative overflow-hidden rounded-[44px] border border-[var(--line)] bg-[rgba(255,255,255,0.58)] px-7 py-9 shadow-[0_28px_80px_rgba(32,46,77,0.06)] md:px-12 md:py-14">
        <div className="hero-orbit left-[-80px] top-20 h-[220px] w-[220px]" />
        <div className="hero-orbit right-[18%] top-8 h-[130px] w-[130px]" />
        <div className="hero-orbit bottom-8 right-[-40px] h-[260px] w-[260px]" />

        <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="signal-chip chip">每日简报 • {todayLabel}</span>
              <span className="text-sm text-[var(--muted)]">科技商业新闻，为清晰决策而筛选</span>
            </div>

            <h1 className="mt-8 max-w-5xl text-balance text-[3.6rem] font-semibold leading-[0.94] tracking-[-0.07em] text-[var(--midnight)] md:text-[6rem]">
              科技商业新闻，
              <br />
              为清晰决策而筛选
            </h1>

            <p className="mt-7 max-w-3xl text-[1.45rem] leading-[1.8] text-[var(--slate)]">
              将 AI、科技与商业信号提炼为聚焦的每日洞察，实时追踪真正值得继续跟进的公司动作、市场变化与职业线索。
            </p>

            <div className="mt-14 flex flex-wrap items-center gap-6 text-base text-[var(--slate)]">
              {latestBrief ? (
                <Link href={`/briefs/${latestBrief.id}`} className="inline-flex items-center gap-2 font-medium text-[var(--midnight)] transition hover:text-[var(--accent-strong)]">
                  阅读本期简报 <span aria-hidden="true">↗</span>
                </Link>
              ) : null}
              <span>Every briefing becomes part of the archive.</span>
            </div>
          </div>

          <div className="rounded-[36px] border border-[var(--line)] bg-[rgba(255,255,255,0.76)] p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--midnight)]">本期你会看到什么</h2>
              <span className="signal-chip chip">{todayLabel}</span>
            </div>

            <div className="mt-6 space-y-4">
              {currentSignals.length ? (
                currentSignals.map((item) => (
                  <Link
                    key={item.id}
                    href={`/briefs/${item.briefId}`}
                    className="soft-card block rounded-[28px] p-5 transition duration-300 hover:-translate-y-1 hover:border-[rgba(214,164,106,0.28)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[var(--sage-soft)] px-3 py-1 text-sm font-medium text-[var(--success)]">
                        {item.category}
                      </span>
                      <span className="text-sm text-[var(--muted)]">{formatRelativeHours(item.publishedAt)}</span>
                    </div>
                    <h3 className="mt-4 text-[1.8rem] font-semibold leading-[1.22] tracking-[-0.05em] text-[var(--midnight)]">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-base leading-8 text-[var(--muted)]">{item.whyImportant}</p>
                  </Link>
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-[var(--line)] px-5 py-6 text-sm leading-7 text-[var(--muted)]">
                  当前还没有可展示的本期新闻。等导入完成后，这里会自动出现 3 条可点击的重点信号。
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="today-headlines" className="mt-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="section-icon">
              <HeadlineIcon />
            </span>
            <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--midnight)]">今日头条</h2>
          </div>
          <div className="hidden items-center gap-3 text-sm text-[var(--muted)] md:flex">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[var(--accent)]" />
              实时 • 5 分钟前更新
            </span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {currentSignals.map((item) => (
            <Link
              key={item.id}
              href={`/briefs/${item.briefId}`}
              className="group rounded-[32px] border border-[var(--line-strong)] bg-white px-7 py-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(32,46,77,0.08)]"
            >
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                <span className="rounded-full bg-[var(--sage)] px-3 py-1 font-medium text-white">{item.category}</span>
                <span>{formatRelativeHours(item.publishedAt)}</span>
              </div>
              <h3 className="mt-6 text-[2.25rem] font-semibold leading-[1.15] tracking-[-0.05em] text-[var(--midnight)]">
                {item.title}
              </h3>
              <p className="mt-5 text-lg leading-9 text-[var(--muted)]">{item.whatHappened}</p>
              <p className="mt-8 text-sm font-medium text-[var(--midnight)] transition group-hover:text-[var(--accent-strong)]">
                点进这期简报查看完整拆解 →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="section-icon">
              <ArchiveIcon />
            </span>
            <div>
              <h2 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--midnight)]">简报归档</h2>
              <p className="mt-2 text-lg text-[var(--muted)]">Every briefing becomes part of the archive.</p>
            </div>
          </div>

          <div className="rounded-full border border-[var(--line-strong)] bg-[rgba(255,255,255,0.85)] p-1">
            <div className="flex items-center gap-1 text-sm">
              <Link
                href="/?order=desc#archive"
                className={`rounded-full px-4 py-2.5 transition ${
                  sortOrder === "desc" ? "bg-[var(--midnight)] text-white" : "text-[var(--muted)] hover:text-[var(--midnight)]"
                }`}
              >
                最新优先
              </Link>
              <Link
                href="/?order=asc#archive"
                className={`rounded-full px-4 py-2.5 transition ${
                  sortOrder === "asc" ? "bg-[var(--midnight)] text-white" : "text-[var(--muted)] hover:text-[var(--midnight)]"
                }`}
              >
                最早优先
              </Link>
            </div>
          </div>
        </div>

        <div id="archive" className="grid gap-5">
          {displayBriefs.map((brief) => (
            <BriefCard
              key={brief.id}
              brief={brief}
              newsCount={newsCountByBrief.get(brief.id) ?? 0}
            />
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
