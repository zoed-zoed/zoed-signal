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
      className="interactive-card group block rounded-[30px] border border-[var(--line-strong)] bg-[rgba(255,255,255,0.78)] px-7 py-7"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <span className="signal-chip chip">{formatDate(brief.date)}</span>
          <span>{newsCount} 条新闻</span>
        </div>

        <h3 className="max-w-4xl text-[2.15rem] font-medium leading-[1.18] tracking-[-0.04em] text-[var(--midnight)]">
          {brief.title}
        </h3>

        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] px-5 py-5">
          <p className="text-sm tracking-[0.08em] text-[var(--accent-strong)]">本期看点</p>
          <p className="mt-4 text-[0.97rem] leading-8 text-[var(--slate)]">
            {brief.coreTrend ?? "点进这一期简报，查看重点新闻、核心判断和后续值得继续跟进的线索。"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end border-t border-[var(--line)] pt-5 text-sm">
        <span className="font-medium text-[var(--midnight)] transition group-hover:text-[var(--accent-strong)]">查看这一期 ↗</span>
      </div>
    </Link>
  );
}
