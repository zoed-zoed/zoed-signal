import Link from "next/link";

import { BriefCard } from "@/components/brief/brief-card";
import { SiteShell } from "@/components/layout/site-shell";
import { getBriefs } from "@/lib/data/briefs";
import { getNewsItems } from "@/lib/data/news";

type HomePageProps = {
  searchParams?: Promise<{
    order?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const [briefs, items] = await Promise.all([getBriefs(), getNewsItems()]);
  const params = (await searchParams) ?? {};
  const sortOrder = params.order === "asc" ? "asc" : "desc";
  const latestBrief = briefs[0];
  const displayBriefs = sortOrder === "asc" ? [...briefs].reverse() : briefs;
  const newsCountByBrief = new Map<string, number>();

  for (const item of items) {
    newsCountByBrief.set(item.briefId, (newsCountByBrief.get(item.briefId) ?? 0) + 1);
  }

  return (
    <SiteShell>
      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="glass-panel rounded-[36px] px-7 py-8 md:px-10 md:py-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="section-label">Warm Editorial × AI Signal Dashboard</span>
            <span className="chip signal-chip">商业科技情报工具</span>
          </div>

          <div className="mt-8 max-w-4xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--slate)]">zoed.signal</p>
            <h1 className="text-balance mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-[var(--charcoal)] md:text-7xl">
              Less slop, <span className="text-[var(--accent-strong)]">more signal.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              把复杂商业科技新闻压缩成有判断力的结构化简报，帮助商科学生更快形成行业认知、求职谈资和可复用的内容资产。
            </p>
          </div>

          <div className="mt-8 editorial-rule" />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={latestBrief ? `/briefs/${latestBrief.id}` : "/"}
              className="inline-flex items-center justify-center rounded-full bg-[var(--charcoal)] px-5 py-3 text-sm font-semibold text-white! transition hover:translate-y-[-1px] hover:bg-black"
              style={{ color: "#ffffff" }}
            >
              查看最新简报
            </Link>
            <Link
              href="/admin/news/new"
              className="inline-flex items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white! transition hover:border-[var(--accent-strong)] hover:bg-[var(--accent-strong)]"
              style={{ color: "#ffffff" }}
            >
              添加新闻
            </Link>
          </div>
        </div>

        <div className="dashboard-card rounded-[36px] p-7 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--slate)]">Signal Board</p>
              <h2 className="mt-4 text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[var(--charcoal)] md:text-[3.8rem]">
                本期你会看到什么
              </h2>
            </div>
            <span className="chip signal-chip mt-1">Vol.1</span>
          </div>

          <div className="mt-8 grid gap-4">
            <BoardCard
              eyebrow="Must read"
              title="企业级 AI Agent"
              detail="看懂 AI 如何真正进入企业流程，而不只是停留在聊天工具层。"
            />
            <BoardCard
              eyebrow="Commercial signal"
              title="AI 定价与商业化"
              detail="从订阅策略、团队套餐和用户分层，看产品如何开始赚钱。"
            />
            <BoardCard
              eyebrow="Career use"
              title="求职 / 商赛可复用"
              detail="每条内容都能被沉淀成面试谈资、案例素材或内容选题。"
            />
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="section-label">Brief List</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[var(--charcoal)]">
                像情报归档一样浏览每一期，而不是像刷普通新闻流
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/?order=desc"
                className={`rounded-full px-4 py-2 text-sm transition ${
                  sortOrder === "desc"
                    ? "bg-[var(--charcoal)] text-white"
                    : "border border-[var(--line)] bg-white/75 text-[var(--foreground)]"
                }`}
              >
                最新优先
              </Link>
              <Link
                href="/?order=asc"
                className={`rounded-full px-4 py-2 text-sm transition ${
                  sortOrder === "asc"
                    ? "bg-[var(--charcoal)] text-white"
                    : "border border-[var(--line)] bg-white/75 text-[var(--foreground)]"
                }`}
              >
                最早优先
              </Link>
            </div>
          </div>

          <div className="grid gap-5">
            {displayBriefs.map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                newsCount={newsCountByBrief.get(brief.id) ?? 0}
              />
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <article className="glass-panel rounded-[30px] p-6">
            <p className="section-label">Why this product</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--charcoal)]">
              不是只告诉你新闻，而是告诉你怎么用
            </h3>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              zoed.signal 的目标不是做泛科技资讯页，而是帮非技术背景学生把 AI 与商业科技新闻转化成面试表达、商赛思路和职业判断。
            </p>
          </article>

          <article className="glass-panel rounded-[30px] p-6">
            <p className="section-label">Output logic</p>
            <div className="mt-4 space-y-4">
              <OutputItem
                index="01"
                title="Signal"
                body="从可靠来源里挑出真正值得看的新闻，不追求堆量。"
              />
              <OutputItem
                index="02"
                title="Context"
                body="解释商业意义和行业位置，帮你建立长期认知。"
              />
              <OutputItem
                index="03"
                title="Action"
                body="给出一个很小的下一步，把新闻变成可积累的资产。"
              />
            </div>
          </article>

          <article className="dashboard-card rounded-[30px] p-6">
            <p className="section-label">Roadmap preview</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--slate)]">
              <li>• 工作日推送</li>
              <li>• 仅周末总结</li>
              <li>• 重大新闻即时提醒 + 日常汇总</li>
              <li>• 收藏后的面试谈资库 / 商赛素材库</li>
            </ul>
          </article>
        </aside>
      </section>
    </SiteShell>
  );
}

function BoardCard({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-white/78 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">{eyebrow}</p>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--charcoal)]">{title}</p>
      <p className="mt-4 text-base leading-9 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function OutputItem({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid grid-cols-[40px_1fr] gap-4">
      <span className="text-sm font-semibold text-[var(--accent-strong)]">{index}</span>
      <div>
        <p className="text-lg font-semibold tracking-tight text-[var(--charcoal)]">{title}</p>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{body}</p>
      </div>
    </div>
  );
}
