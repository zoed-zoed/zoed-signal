import { NewsEditorForm } from "@/components/forms/news-editor-form";
import { SiteShell } from "@/components/layout/site-shell";
import { getBriefs } from "@/lib/data/briefs";

export default async function NewNewsPage() {
  const briefs = await getBriefs();

  return (
    <SiteShell>
      <section className="glass-panel rounded-[40px] p-7 md:p-10">
        <p className="section-label">New item</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">新增一条新闻卡片</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          先人工录入和编辑，是这版 MVP 最稳的做法。等结构跑顺以后，再把 RSS、AI 摘要和自动分类接进来。
        </p>

        <div className="mt-8">
          <NewsEditorForm briefs={briefs} />
        </div>
      </section>
    </SiteShell>
  );
}
