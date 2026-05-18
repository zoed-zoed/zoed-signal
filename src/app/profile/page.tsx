import { SiteShell } from "@/components/layout/site-shell";
import { getBookmarks } from "@/lib/data/bookmarks";
import { getCurrentProfile, getCurrentUserReads } from "@/lib/data/profile";
import { formatMonthLabel } from "@/lib/utils/format";

export default async function ProfilePage() {
  const [profile, bookmarks, reads] = await Promise.all([getCurrentProfile(), getBookmarks(), getCurrentUserReads()]);

  const now = new Date();
  const monthReadCount = reads.filter((read) => {
    const date = new Date(read.readAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;
  const streakDays = computeReadStreak(reads);
  const activityDays = buildActivityDays(reads);

  return (
    <SiteShell activeNav="profile">
      <section className="rounded-[42px] border border-[var(--line)] bg-[rgba(255,255,255,0.78)] px-7 py-8 md:px-10 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[var(--midnight)] text-white">
              <ProfileAvatar />
              <span className="absolute bottom-2 right-1 h-4 w-4 rounded-full border-4 border-[var(--surface)] bg-[var(--sage)]" />
            </div>

            <div className="max-w-3xl">
              <h1 className="text-[3rem] font-semibold tracking-[-0.06em] text-[var(--midnight)]">{profile.displayName}</h1>
              <p className="mt-3 text-[1.1rem] leading-8 text-[var(--slate)]">
                {profile.careerDirection ? profile.careerDirection : "持续跟踪 AI、市场与公司信号，把每天的阅读沉淀成长期判断。"}
              </p>
              <div className="mt-4 flex flex-wrap gap-5 text-base text-[var(--muted)]">
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

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <CompactStatCard label="本月已读" value={String(monthReadCount)} />
        <CompactStatCard label="连续阅读" value={`${streakDays} 天`} />
        <CompactStatCard label="收藏总数" value={String(bookmarks.length)} />
      </section>

      <section className="mt-12 space-y-8">
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

        <div className="rounded-[30px] border border-[var(--line-strong)] bg-white px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-[var(--midnight)]">阅读概况</h2>
            <span className="text-sm text-[var(--muted)]">保留你最近两周的阅读节奏和活跃程度</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <ReadingSummaryCard label="近 14 天阅读" value={String(reads.length)} description="累计记录" />
            <ReadingSummaryCard label="连续阅读天数" value={`${streakDays}`} description="当前" />
            <ReadingSummaryCard label="收藏文章" value={String(bookmarks.length)} description="同步展示在收藏夹" />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function CompactStatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[26px] border border-[var(--line-strong)] bg-white px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-base text-[var(--muted)]">{label}</p>
        <p className="text-[2.5rem] font-semibold leading-none tracking-[-0.06em] text-[var(--midnight)]">{value}</p>
      </div>
    </article>
  );
}

function ReadingSummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-5 py-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-[2.5rem] font-semibold leading-none tracking-[-0.06em] text-[var(--midnight)]">{value}</p>
      <p className="mt-3 text-sm text-[var(--sage)]">{description}</p>
    </article>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-[2.8rem] font-semibold tracking-[-0.06em] text-[var(--midnight)]">{title}</h2>
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
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12A4.5 4.5 0 1 0 12 3A4.5 4.5 0 0 0 12 12Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 20C5.5 16.7 8.4 14.5 12 14.5C15.6 14.5 18.5 16.7 18.5 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
