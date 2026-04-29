import Link from "next/link";

import { formatDate } from "@/lib/utils/format";
import type { Brief } from "@/types/brief";

type BriefCardProps = {
  brief: Brief;
  newsCount: number;
};

export function BriefCard({ brief, newsCount }: BriefCardProps) {
  return (
    <Link
      href={`/briefs/${brief.id}`}
      className="group glass-panel block rounded-[24px] border border-[var(--line)] p-6 transition duration-300 hover:-translate-y-1 hover:border-[rgba(159,84,47,0.22)] hover:shadow-[0_18px_50px_rgba(22,24,27,0.1)]"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="section-label">Briefing Archive</span>
        <span className="chip signal-chip">{formatDate(brief.date)}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-[var(--charcoal)]">{brief.title}</h3>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">{brief.intro}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {brief.tags.map((tag) => (
              <span className="chip signal-chip" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="dashboard-card rounded-[22px] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--slate)]">
            Signal Snapshot
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--muted)]">新闻数量</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--charcoal)]">{newsCount}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">核心用途</p>
              <p className="mt-2 text-sm leading-6 text-[var(--slate)]">求职谈资 / 商赛素材 / 行业判断</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 editorial-rule" />
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">点击进入这一期，查看结构化新闻卡片与本期总结。</p>
        <span className="text-sm font-medium text-[var(--accent-strong)] transition group-hover:translate-x-1">
          查看详情 →
        </span>
      </div>
    </Link>
  );
}
