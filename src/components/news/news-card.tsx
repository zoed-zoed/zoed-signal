import { BookmarkControls } from "@/components/news/bookmark-controls";
import { formatDate } from "@/lib/utils/format";
import { IMPORTANCE_OPTIONS, type NewsItem } from "@/types/news";

type NewsCardProps = {
  item: NewsItem;
};

export function NewsCard({ item }: NewsCardProps) {
  return (
    <article className="rounded-[34px] border border-[var(--line-strong)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[0_18px_48px_rgba(32,46,77,0.05)] md:p-7">
      <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="chip">{formatDate(item.publishedAt)}</span>
            <span className={`chip ${item.importance === IMPORTANCE_OPTIONS[0] ? "importance-must" : "importance-scan"}`}>
              {item.importance}
            </span>
            <span className="chip">{item.category}</span>
          </div>

          <h2 className="max-w-3xl text-[2.25rem] font-semibold leading-[1.18] tracking-[-0.05em] text-[var(--midnight)]">
            {item.title}
          </h2>

          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span className="chip" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="min-w-[220px] rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          <p className="font-medium text-[var(--midnight)]">来源</p>
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
        <InfoBlock title="你可以怎么用" content={item.interviewOrCaseUse} />
      </div>

      <div className="mt-6 border-t border-[var(--line)] pt-5">
        <BookmarkControls newsId={item.id} initialSavedTypes={item.savedType} />
      </div>
    </article>
  );
}

function InfoBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-4">
      <p className="text-sm font-medium text-[var(--midnight)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{content}</p>
    </div>
  );
}
