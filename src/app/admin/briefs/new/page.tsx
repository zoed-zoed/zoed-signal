import { BriefEditorForm } from "@/components/forms/brief-editor-form";
import { SiteShell } from "@/components/layout/site-shell";

export default function NewBriefPage() {
  return (
    <SiteShell activeNav="admin" showDock={false} showAdminLink>
      <section className="glass-panel rounded-[40px] p-7 md:p-10">
        <p className="section-label">New brief</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">新增一期简报</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          先把简报骨架建好，后面新增新闻时就能直接把内容归到对应期数里，不用再回头手改 JSON。
        </p>

        <div className="mt-8">
          <BriefEditorForm />
        </div>
      </section>
    </SiteShell>
  );
}
