import { SiteShell } from "@/components/layout/site-shell";

export default function SubscribePage() {
  return (
    <SiteShell activeNav="subscribe">
      <section className="rounded-[44px] border border-[var(--line)] bg-[var(--midnight)] px-8 py-12 text-white md:px-12 md:py-14">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-[3.2rem] font-semibold tracking-[-0.06em] md:text-[4.6rem]">不错过任何信号</h1>
          <p className="mt-6 text-[1.3rem] leading-9 text-[rgba(255,255,255,0.82)]">
            每日精选洞察直达你的收件箱。这里先保留页面入口，后面再接入真正的订阅功能。
          </p>

          <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-4 rounded-[30px] bg-white/8 p-5 backdrop-blur md:flex-row">
            <input
              type="email"
              placeholder="输入你的邮箱"
              className="h-16 flex-1 rounded-[22px] border border-white/10 bg-white px-5 text-lg text-[var(--midnight)] outline-none placeholder:text-[rgba(31,49,86,0.45)]"
            />
            <button className="h-16 rounded-[22px] bg-[var(--accent)] px-10 text-lg font-medium text-[var(--midnight)] transition hover:bg-[#e8bc83]">
              订阅
            </button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
