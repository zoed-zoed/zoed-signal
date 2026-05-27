import Link from "next/link";

type SiteShellProps = {
  children: React.ReactNode;
  activeNav?: "home" | "news" | "analysis" | "library" | "profile" | "subscribe" | "admin";
  showDock?: boolean;
  showAdminLink?: boolean;
};

const primaryNav = [
  { href: "/", label: "首页", key: "home" as const },
  { href: "/subscribe", label: "订阅", key: "subscribe" as const },
];

const dockNav = [
  { href: "/", label: "首页", key: "home" as const, icon: HomeIcon },
  { href: "/library", label: "收藏夹", key: "library" as const, icon: LibraryIcon },
  { href: "/profile", label: "个人页", key: "profile" as const, icon: ProfileIcon },
];

export function SiteShell({
  children,
  activeNav = "home",
  showDock = true,
  showAdminLink = false,
}: SiteShellProps) {
  const dockActiveKey =
    activeNav === "news" || activeNav === "analysis" || activeNav === "subscribe" ? "home" : activeNav;
  const activeDockIndex = Math.max(
    0,
    dockNav.findIndex((item) => item.key === dockActiveKey),
  );

  return (
    <div className="min-h-screen bg-[var(--background)] pb-32">
      <header className="page-shell pt-5 md:pt-7">
        <div className="site-header flex items-center justify-between gap-4 rounded-[24px] px-5 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[rgba(212,165,116,0.14)] text-[var(--accent)]">
              <BrandMark />
            </div>
            <div>
              <p className="text-[1.85rem] font-semibold tracking-[-0.04em] text-[var(--midnight)]">Zoed-signal</p>
              <p className="text-sm text-[var(--muted)]">Less slop, more signal.</p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <nav className="flex items-center gap-2 text-sm text-[var(--muted)]">
              {primaryNav.map((item) => {
                const active = item.key === activeNav;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`nav-link rounded-full px-4 py-2.5 ${
                      active
                        ? "bg-[rgba(31,49,86,0.06)] font-medium text-[var(--midnight)]"
                        : "hover:bg-white hover:text-[var(--midnight)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/profile"
              aria-label="个人页"
              className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--midnight)] text-[var(--surface)] transition-colors duration-200 hover:bg-[var(--midnight-soft)]"
            >
              <ProfileIcon />
            </Link>

            {showAdminLink ? (
              <Link
                href="/admin"
                className="nav-link rounded-full border border-[var(--line-strong)] px-4 py-2.5 text-sm text-[var(--midnight)] hover:bg-white"
              >
                后台管理
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="page-shell pt-8">{children}</main>

      {showDock ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <nav className="floating-dock pointer-events-auto relative grid min-w-[320px] grid-cols-3 gap-2 rounded-full p-2 shadow-[0_20px_40px_rgba(20,31,58,0.12)] sm:min-w-[380px]">
            <div className="pointer-events-none absolute inset-2 grid grid-cols-3 gap-2">
              <span
                className="dock-indicator rounded-full bg-[var(--midnight)] shadow-[0_14px_28px_rgba(31,46,77,0.24)]"
                style={{ gridColumn: `${activeDockIndex + 1}` }}
              />
            </div>

            {dockNav.map((item) => {
              const active = item.key === dockActiveKey;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`dock-link relative z-10 flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-full px-4 py-3 text-center ${
                    active ? "text-[var(--surface)]" : "text-[var(--midnight)]"
                  }`}
                >
                  <span className={active ? "text-[var(--surface)]" : "text-[var(--midnight)]"}>
                    <Icon />
                  </span>
                  <span className={`text-[0.98rem] ${active ? "font-medium text-[var(--surface)]" : "text-[var(--midnight)]"}`}>
                    {item.label}
                  </span>
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
      <path
        d="M2 10H5.4L7.3 3.8L10.2 15.2L13 7.3L14.7 10H18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12A4 4 0 1 0 12 4A4 4 0 0 0 12 12Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M5 20C5 16.9 8.1 14.5 12 14.5C15.9 14.5 19 16.9 19 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
