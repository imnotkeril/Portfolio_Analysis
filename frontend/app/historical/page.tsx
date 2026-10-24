"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";

type Crisis = { key: string; name: string };

export default function HistoricalPage() {
  const [list, setList] = useState<Crisis[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Crisis[]>("/advanced/historical-crises")
      .then(setList)
      .catch(() => setErr("API unavailable"));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-light text-white">Historical crises</h1>
      <p className="mb-8 text-[var(--wm-text-muted)]">
        Context library used for analogy and education (read-only from API).
      </p>
      {err && <p className="text-sm text-[var(--wm-red)]">{err}</p>}
      <ul className="space-y-2">
        {list.map((c) => (
          <li key={c.key}>
            <Link
              href={`/historical/${encodeURIComponent(c.key)}`}
              className="glass-panel block rounded-xl px-4 py-3 text-white hover:border-[var(--wm-accent)]"
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
