"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-20">
      <section className="glass-panel w-full rounded-[32px] p-8 md:p-10">
        <p className="section-label">Data source error</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--charcoal)]">
          当前内容暂时无法加载
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          正式数据源来自 Supabase。当前请求没有成功读到真实内容，所以页面没有回退到本地 mock 数据。
          你可以稍后重试，或检查 Supabase 连接与服务状态。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[var(--charcoal)] px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
          >
            重试
          </button>
        </div>
      </section>
    </main>
  );
}
