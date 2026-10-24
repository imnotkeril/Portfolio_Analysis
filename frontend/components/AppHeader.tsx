import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/create", label: "Create" },
  { href: "/portfolios", label: "Portfolios" },
  { href: "/analysis", label: "Analysis" },
  { href: "/correlation", label: "Correlation" },
  { href: "/optimize", label: "Optimize" },
  { href: "/stress", label: "Stress" },
  { href: "/historical", label: "Historical" },
];

export function AppHeader({ active }: { active?: string }) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--wm-border)] bg-[var(--wm-bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xs font-medium tracking-[0.25em] text-white">
          WILD MARKET
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors hover:text-white ${
                active === l.href
                  ? "text-white underline decoration-[var(--wm-accent)] decoration-2 underline-offset-8"
                  : "text-[var(--wm-text-muted)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <a
          href="https://wildmarket.capital/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--wm-text-dim)] hover:text-[var(--wm-accent)]"
        >
          wildmarket.capital
        </a>
      </div>
    </header>
  );
}
