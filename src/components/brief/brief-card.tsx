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
      className="group block rounded-[34px] border border-[var(--line-strong)] bg-[rgba(255,255,255,0.78)] px-7 py-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(32,46,77,0.08)]"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
            <span className="signal-chip chip">{formatDate(brief.date)}</span>
            <span>{newsCount} 条新闻</span>
            {brief.tags.slice(0, 2).map((tag) => (
              <span className="rounded-full bg-[var(--chip)] px-3 py-1" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <h3 className="mt-5 text-[2.45rem] font-semibold leading-[1.1] tracking-[-0.06em] text-[var(--midnight)]">
            {brief.title}
          </h3>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">{brief.intro}</p>
        </div>

        <div className="min-w-[220px] rounded-[28px] border border-[var(--line)] bg-[var(--surface)] px-5 py-5">
          <p className="text-sm tracking-[0.18em] text-[var(--accent-strong)] uppercase">本期重点</p>
          <p className="mt-4 text-base leading-8 text-[var(--slate)]">
            {brief.coreTrend ?? "点击进入本期简报，查看整理后的新闻卡片、关键信号和可继续延展的分析方向。"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
        <span>归档后的每一期，都会保留完整内容脉络和后续引用价值。</span>
        <span className="font-medium text-[var(--midnight)] transition group-hover:text-[var(--accent-strong)]">
          查看这一期 →
        </span>
      </div>
    </Link>
  );
}
