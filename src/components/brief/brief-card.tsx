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
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <span className="signal-chip chip">{formatDate(brief.date)}</span>
          <span>{newsCount} 条新闻</span>
        </div>

        <h3 className="max-w-4xl text-[2.45rem] font-semibold leading-[1.1] tracking-[-0.06em] text-[var(--midnight)]">
          {brief.title}
        </h3>

        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] px-5 py-5">
          <p className="text-sm tracking-[0.12em] text-[var(--accent-strong)]">本期看点</p>
          <p className="mt-4 text-base leading-8 text-[var(--slate)]">
            {brief.coreTrend ?? "点进去查看这期简报的重点新闻、核心判断和可以继续调用的素材线索。"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end border-t border-[var(--line)] pt-5 text-sm">
        <span className="font-medium text-[var(--midnight)] transition group-hover:text-[var(--accent-strong)]">
          查看这一期 ↗
        </span>
      </div>
    </Link>
  );
}
