import { BookmarkControls } from "@/components/news/bookmark-controls";
import { formatDate } from "@/lib/utils/format";
import type { NewsItem } from "@/types/news";

type NewsCardProps = {
  item: NewsItem;
};

export function NewsCard({ item }: NewsCardProps) {
  return (
    <article className="glass-panel rounded-[30px] border border-[var(--line)] p-6">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className={`chip ${item.importance === "必看" ? "importance-must" : "importance-scan"}`}>
              {item.importance}
            </span>
            <span className="chip">{item.category}</span>
            <span className="chip">{formatDate(item.publishedAt)}</span>
          </div>
          <h2 className="max-w-3xl text-2xl font-semibold leading-9 tracking-tight">{item.title}</h2>
        </div>

        <div className="min-w-[220px] rounded-[22px] border border-[var(--line)] bg-white/70 p-4 text-sm text-[var(--muted)]">
          <p className="font-medium text-[var(--foreground)]">来源</p>
          <p className="mt-2">{item.sourceName}</p>
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-[var(--accent-strong)] underline decoration-[rgba(166,69,31,0.35)] underline-offset-4"
          >
            查看原文
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InfoBlock title="发生了什么" content={item.whatHappened} />
        <InfoBlock title="为什么重要" content={item.whyImportant} />
        <InfoBlock title="和商科生的关系" content={item.relevanceToBusinessStudents} />
        <InfoBlock title="可以怎么用于面试 / 商赛" content={item.interviewOrCaseUse} />
      </div>

      <div className="mt-6 grid gap-6 border-t border-[var(--line)] pt-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">下一步行动建议</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.nextAction}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span className="chip" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <BookmarkControls newsId={item.id} initialSavedTypes={item.savedType} />
      </div>
    </article>
  );
}

function InfoBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-white/72 p-4">
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{content}</p>
    </div>
  );
}
