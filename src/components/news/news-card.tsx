import { BookmarkControls } from "@/components/news/bookmark-controls";
import { formatDate } from "@/lib/utils/format";
import { IMPORTANCE_OPTIONS, type NewsItem } from "@/types/news";

type NewsCardProps = {
  item: NewsItem;
};

export function NewsCard({ item }: NewsCardProps) {
  return (
    <article className="interactive-card rounded-[28px] border border-[var(--line-strong)] bg-white p-6 shadow-[0_12px_30px_rgba(26,41,66,0.05)] md:p-7">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
          <span>{formatDate(item.publishedAt)}</span>
          <span>·</span>
          <span className={`chip ${item.importance === IMPORTANCE_OPTIONS[0] ? "importance-must" : "importance-scan"}`}>
            {item.importance}
          </span>
          <span className="chip">{item.category}</span>
        </div>

        <div className="space-y-3">
          <h2 className="max-w-4xl text-[1.95rem] font-medium leading-[1.32] tracking-[-0.03em] text-[var(--midnight)] md:text-[2.08rem]">
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

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="space-y-4">
            <ContentBlock title="主要内容" content={item.whatHappened} />
            <ContentBlock title="推荐理由" content={item.whyImportant} subtle />
          </div>

          <div className="grid gap-4">
            <InfoCard title="来源" accent="link">
              <p>{item.sourceName}</p>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-[var(--accent-strong)] underline decoration-[rgba(166,69,31,0.35)] underline-offset-4"
              >
                查看原文
              </a>
            </InfoCard>

            <InfoCard title="加入收藏夹">
              <BookmarkControls newsId={item.id} initialSavedTypes={item.savedType} />
            </InfoCard>
          </div>
        </div>
      </div>
    </article>
  );
}

function ContentBlock({
  title,
  content,
  subtle = false,
}: {
  title: string;
  content: string;
  subtle?: boolean;
}) {
  return (
    <div className={`rounded-[20px] border border-[var(--line)] p-5 ${subtle ? "bg-[rgba(250,248,245,0.88)]" : "bg-[var(--surface)]"}`}>
      <p className="text-sm font-medium text-[var(--midnight)]">{title}</p>
      <p className="mt-3 text-[0.97rem] leading-8 text-[var(--muted)]">{content}</p>
    </div>
  );
}

function InfoCard({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: "link";
}) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[rgba(255,255,255,0.86)] p-5 text-sm text-[var(--muted)]">
      <p className={`font-medium ${accent === "link" ? "text-[var(--midnight)]" : "text-[var(--midnight)]"}`}>{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}
