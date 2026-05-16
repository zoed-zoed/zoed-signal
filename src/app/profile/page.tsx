import { SiteShell } from "@/components/layout/site-shell";
import { getBookmarks } from "@/lib/data/bookmarks";
import { getNewsItems } from "@/lib/data/news";
import { getCurrentProfile, getCurrentUserReads } from "@/lib/data/profile";
import { formatDate, formatMonthLabel } from "@/lib/utils/format";

export default async function ProfilePage() {
  const [profile, bookmarks, reads, items] = await Promise.all([
    getCurrentProfile(),
    getBookmarks(),
    getCurrentUserReads(),
    getNewsItems({ onlyPublished: true }),
  ]);

  const itemMap = new Map(items.map((item) => [item.id, item]));
  const readSet = new Set(reads.map((read) => read.newsId));
  const now = new Date();
  const monthReadCount = reads.filter((read) => {
    const date = new Date(read.readAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;
  const streakDays = computeReadStreak(reads);
  const activityDays = buildActivityDays(reads);
  const savedArticles = bookmarks
    .map((bookmark) => ({
      bookmark,
      item: itemMap.get(bookmark.newsId),
    }))
    .filter((entry) => entry.item)
    .slice(0, 6);

  return (
    <SiteShell activeNav="profile">
      <section className="rounded-[42px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] px-7 py-8 md:px-10 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[var(--midnight)] text-white">
              <ProfileAvatar />
              <span className="absolute bottom-3 right-2 h-5 w-5 rounded-full border-4 border-[var(--surface)] bg-[var(--sage)]" />
            </div>

            <div>
              <h1 className="text-[3.5rem] font-semibold tracking-[-0.06em] text-[var(--midnight)]">{profile.displayName}</h1>
              <p className="mt-4 max-w-3xl text-[1.15rem] leading-8 text-[var(--slate)]">
                {profile.careerDirection
                  ? `${profile.careerDirection}，持续跟踪 AI、公司战略与商业信号。`
                  : "持续跟踪 AI、市场与公司信号，把每天的阅读沉淀成长期判断。"}
              </p>
              <div className="mt-5 flex flex-wrap gap-5 text-base text-[var(--muted)]">
                {profile.createdAt ? <span>{formatMonthLabel(profile.createdAt)}加入</span> : null}
                {profile.major ? <span>{profile.major}</span> : null}
                {profile.academicYear ? <span>{profile.academicYear}</span> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <button className="rounded-full border border-[var(--line-strong)] px-5 py-3 text-base text-[var(--midnight)] transition hover:bg-white">
              设置
            </button>
            <button className="rounded-full bg-[var(--midnight)] px-5 py-3 text-base text-white transition hover:bg-[var(--midnight-soft)]">
              通知
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-3">
        <StatCard label="已读文章" value={String(monthReadCount)} caption="本月" />
        <StatCard label="连续阅读" value={`${streakDays} 天`} caption="当前" />
        <StatCard label="收藏内容" value={String(bookmarks.length)} caption="总计" />
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <SectionHeader title="收藏文章" trailing="查看全部" />
          <div className="space-y-4">
            {savedArticles.length ? (
              savedArticles.map(({ bookmark, item }, index) => {
                const progress = readSet.has(item!.id) ? 100 : Math.max(24, 60 - index * 8);
                return (
                  <article key={`${bookmark.newsId}-${bookmark.bucket}`} className="rounded-[30px] border border-[var(--line-strong)] bg-white px-6 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="rounded-full bg-[var(--sage-soft)] px-3 py-1 text-sm font-medium text-[var(--success)]">
                        {item!.category}
                      </span>
                      <span className="text-sm text-[var(--muted)]">收藏于 {formatDate(bookmark.createdAt)}</span>
                    </div>
                    <h3 className="mt-4 text-[2rem] font-semibold leading-[1.18] tracking-[-0.05em] text-[var(--midnight)]">
                      {item!.title}
                    </h3>
                    <p className="mt-4 text-base leading-8 text-[var(--muted)]">{item!.interviewOrCaseUse}</p>
                    <div className="mt-5 flex items-center justify-between gap-4 text-sm text-[var(--muted)]">
                      <span>{readSet.has(item!.id) ? "已读完成" : "继续阅读"}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(95,114,82,0.12)]">
                      <div className="h-full rounded-full bg-[var(--sage)]" style={{ width: `${progress}%` }} />
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[30px] border border-dashed border-[var(--line)] px-6 py-8 text-sm leading-7 text-[var(--muted)]">
                你还没有收藏内容。去任意一条新闻卡片点一下“加入素材库”，这里就会开始出现你的文章列表。
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-8">
          <div>
            <SectionHeader title="阅读活动" />
            <article className="mt-4 rounded-[30px] border border-[var(--line-strong)] bg-white px-5 py-6">
              <div className="grid grid-cols-7 gap-3">
                {activityDays.map((day) => (
                  <div key={day.label} className="space-y-3 text-center">
                    <div className="flex h-28 items-end justify-center rounded-[20px] bg-[rgba(31,49,86,0.04)] px-2 pb-2">
                      <div
                        className="w-full rounded-full bg-[var(--midnight)]"
                        style={{ height: `${Math.max(10, day.count * 22)}px`, opacity: day.count ? 1 : 0.18 }}
                      />
                    </div>
                    <p className="text-xs text-[var(--muted)]">{day.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-sm text-[var(--muted)]">近 14 天阅读活动</p>
            </article>
          </div>

          <div>
            <SectionHeader title="你的兴趣" trailing="编辑" />
            <div className="mt-4 flex flex-wrap gap-3">
              {(profile.interests.length ? profile.interests : ["AI 与机器学习", "企业 SaaS", "风险投资", "半导体行业"]).map((interest) => (
                <span key={interest} className="rounded-full border border-[var(--line-strong)] px-4 py-3 text-base text-[var(--midnight)]">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </SiteShell>
  );
}

function StatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <article className="rounded-[32px] border border-[var(--line-strong)] bg-white px-7 py-6">
      <p className="text-lg text-[var(--muted)]">{label}</p>
      <p className="mt-5 text-[4rem] font-semibold leading-none tracking-[-0.07em] text-[var(--midnight)]">{value}</p>
      <p className="mt-4 text-xl text-[var(--sage)]">{caption}</p>
    </article>
  );
}

function SectionHeader({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-[2.8rem] font-semibold tracking-[-0.06em] text-[var(--midnight)]">{title}</h2>
      {trailing ? <span className="text-xl text-[var(--accent-strong)]">{trailing}</span> : null}
    </div>
  );
}

function computeReadStreak(reads: { readAt: string }[]) {
  if (!reads.length) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(
      reads.map((read) => {
        const date = new Date(read.readAt);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      }),
    ),
  )
    .map((value) => new Date(value))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date();
  let compare = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let streak = 0;

  for (const day of uniqueDays) {
    if (day.getTime() === compare.getTime()) {
      streak += 1;
      compare = new Date(compare.getTime() - 24 * 60 * 60 * 1000);
      continue;
    }

    if (streak === 0 && day.getTime() === compare.getTime() - 24 * 60 * 60 * 1000) {
      streak += 1;
      compare = new Date(day.getTime() - 24 * 60 * 60 * 1000);
      continue;
    }

    break;
  }

  return streak;
}

function buildActivityDays(reads: { readAt: string }[]) {
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    return {
      key,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      count: 0,
    };
  });

  const countByDay = new Map<string, number>();
  for (const read of reads) {
    const date = new Date(read.readAt);
    const key = `${date.getMonth() + 1}/${date.getDate()}`;
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  return days.map((day) => ({
    label: day.label,
    count: countByDay.get(day.key) ?? 0,
  }));
}

function ProfileAvatar() {
  return (
    <svg width="70" height="70" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12A4.5 4.5 0 1 0 12 3A4.5 4.5 0 0 0 12 12Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 20C5.5 16.7 8.4 14.5 12 14.5C15.6 14.5 18.5 16.7 18.5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
