import Link from "next/link";
import { Starfield } from "@/components/Starfield";
import { HealthBadge } from "@/components/HealthBadge";

export default function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      <Starfield />
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <p className="mb-4 text-xs tracking-[0.35em] text-[var(--wm-text-dim)]">
          PORTFOLIO ANALYZER
        </p>
        <h1 className="mb-6 text-4xl font-extralight tracking-tight text-white md:text-5xl">
          Silence the noise
        </h1>
        <p className="mb-10 max-w-xl text-lg text-[var(--wm-text-muted)]">
          Professional asset analytics, optimization, and scenario tools — powered by the same
          quantitative stack as our capital desk.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/analysis"
            className="glow-ring rounded-md border border-white/30 px-8 py-3 text-sm font-medium text-white transition hover:border-[var(--wm-accent)] hover:text-[var(--wm-accent)]"
          >
            Open analysis
          </Link>
          <Link
            href="/create"
            className="rounded-md border border-transparent px-6 py-3 text-sm text-[var(--wm-text-muted)] hover:text-white"
          >
            Create portfolio
          </Link>
        </div>
        <div className="mt-16 w-full max-w-md">
          <HealthBadge />
        </div>
      </div>
    </main>
  );
}
