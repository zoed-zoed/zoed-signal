import { notFound } from "next/navigation";

import { BriefEditorForm } from "@/components/forms/brief-editor-form";
import { SiteShell } from "@/components/layout/site-shell";
import { getBriefById } from "@/lib/data/briefs";
import { getNewsForBrief } from "@/lib/data/news";

type EditBriefPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBriefPage({ params }: EditBriefPageProps) {
  const { id } = await params;
  const [brief, items] = await Promise.all([getBriefById(id), getNewsForBrief(id)]);

  if (!brief) {
    notFound();
  }

  return (
    <SiteShell activeNav="admin" showDock={false} showAdminLink>
      <section className="glass-panel rounded-[40px] p-7 md:p-10">
        <p className="section-label">Edit brief</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">编辑简报信息</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          这里主要维护这一期简报的简介、标签和总结内容。已经归属到这期的新闻不会丢，但为了稳妥起见不开放修改期数。
        </p>

        <div className="mt-8">
          <BriefEditorForm initialData={brief} linkedNewsCount={items.length} />
        </div>
      </section>
    </SiteShell>
  );
}
