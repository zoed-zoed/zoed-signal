import Link from "next/link";

type SiteShellProps = {
  children: React.ReactNode;
  activeNav?: "home" | "news" | "analysis" | "library" | "profile" | "admin";
  showDock?: boolean;
  showAdminLink?: boolean;
};

const primaryNav = [
  { href: "/", label: "首页", key: "home" as const },
  { href: "/#today-headlines", label: "新闻", key: "news" as const },
  { href: "/#archive", label: "分析", key: "analysis" as const },
  { href: "/library", label: "趋势", key: "library" as const },
];

const dockNav = [
  { href: "/", label: "首页", shortLabel: "首页", key: "home" as const, icon: HomeIcon },
  { href: "/library", label: "素材库", shortLabel: "素材库", key: "library" as const, icon: LibraryIcon },
  { href: "/profile", label: "个人页", shortLabel: "个人", key: "profile" as const, icon: ProfileIcon },
];

export function SiteShell({
  children,
  activeNav = "home",
  showDock = true,
  showAdminLink = false,
}: SiteShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] pb-32">
      <header className="page-shell pt-5 md:pt-7">
        <div className="site-header flex items-center justify-between gap-6 rounded-[28px] px-5 py-4 md:px-7">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[rgba(214,164,106,0.14)] text-[var(--accent)]">
              <BrandMark />
            </div>
            <div>
              <p className="text-[1.95rem] font-semibold tracking-[-0.05em] text-[var(--midnight)]">Zoed-signal</p>
              <p className="text-sm text-[var(--muted)]">Less slop, more signal.</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 text-base text-[var(--muted)] md:flex">
            {primaryNav.map((item) => {
              const active = item.key === activeNav;
              return (
                <Link
                  key={item.href}
                  className={`rounded-full px-4 py-2.5 transition ${
                    active
                      ? "bg-[var(--midnight)] text-white"
                      : "hover:bg-white hover:text-[var(--midnight)]"
                  }`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              className="rounded-full bg-[var(--midnight)] px-5 py-2.5 font-medium text-white transition hover:bg-[var(--midnight-soft)]"
              href="/profile"
            >
              订阅
            </Link>
            {showAdminLink ? (
              <Link
                className="rounded-full border border-[var(--line-strong)] px-4 py-2.5 text-sm hover:bg-white"
                href="/admin"
              >
                管理后台
              </Link>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="page-shell pt-8">{children}</main>

      {showDock ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <nav className="floating-dock pointer-events-auto flex items-center gap-2 rounded-full px-3 py-3 shadow-[0_20px_40px_rgba(20,31,58,0.12)]">
            {dockNav.map((item) => {
              const active =
                item.key === activeNav || ((activeNav === "news" || activeNav === "analysis") && item.key === "home");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-[110px] items-center justify-center gap-2 rounded-full px-5 py-3 text-base transition ${
                    active
                      ? "bg-[var(--midnight)] text-white shadow-[0_12px_24px_rgba(31,46,77,0.2)]"
                      : "text-[var(--midnight)] hover:bg-[rgba(255,255,255,0.78)]"
                  }`}
                >
                  <Icon />
                  <span>{item.shortLabel}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </div>
  );
}

function BrandMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2 10H5.4L7.3 3.8L10.2 15.2L13 7.3L14.7 10H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15.8" cy="4.2" r="1.4" fill="currentColor" opacity="0.9" />
      <path d="M14.9 1.5L15.4 2.7L16.7 3.2L15.4 3.7L14.9 4.9L14.4 3.7L13.2 3.2L14.4 2.7L14.9 1.5Z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5L12 4L20 10.5V19A1 1 0 0 1 19 20H5A1 1 0 0 1 4 19V10.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.5 20V13H14.5V20" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4.5H18A1 1 0 0 1 19 5.5V19.5L12 16.4L5 19.5V5.5A1 1 0 0 1 6 4.5Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12A4 4 0 1 0 12 4A4 4 0 0 0 12 12Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 20C5 16.9 8.1 14.5 12 14.5C15.9 14.5 19 16.9 19 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
