import Link from "next/link";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="grid-lines min-h-screen pb-16">
      <header className="page-shell pt-6">
        <div className="glass-panel flex items-center justify-between rounded-[24px] px-5 py-4 md:px-7">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-[var(--charcoal)] text-sm font-semibold text-white shadow-[0_18px_35px_rgba(34,37,43,0.12)]">
              zs
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">zoed.signal</p>
              <p className="text-sm text-[var(--muted)]">Less slop, more signal.</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-3 text-sm text-[var(--muted)] md:flex">
            <Link className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[var(--foreground)]" href="/">
              简报首页
            </Link>
            <Link className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[var(--foreground)]" href="/library">
              素材库
            </Link>
            <Link className="rounded-full bg-[var(--accent)] px-4 py-2 font-medium text-white transition hover:bg-[var(--accent-strong)]" href="/admin">
              后台管理
            </Link>
          </nav>
        </div>
      </header>

      <main className="page-shell pt-8">{children}</main>
    </div>
  );
}
