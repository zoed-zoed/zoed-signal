import { notFound } from "next/navigation";

import { NewsEditorForm } from "@/components/forms/news-editor-form";
import { SiteShell } from "@/components/layout/site-shell";
import { getBriefs } from "@/lib/data/briefs";
import { getNewsById } from "@/lib/data/news";

type EditNewsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditNewsPage({ params }: EditNewsPageProps) {
  const { id } = await params;
  const [briefs, item] = await Promise.all([getBriefs(), getNewsById(id)]);

  if (!item) {
    notFound();
  }

  return (
    <SiteShell>
      <section className="glass-panel rounded-[40px] p-7 md:p-10">
        <p className="section-label">Edit item</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">编辑新闻卡片</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          修改后的内容会直接写回本地 JSON 数据，适合你先做自己的产品样板和作品集展示。
        </p>

        <div className="mt-8">
          <NewsEditorForm briefs={briefs} initialData={item} />
        </div>
      </section>
    </SiteShell>
  );
}
