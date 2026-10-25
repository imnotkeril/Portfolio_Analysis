"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";

type CrisisDetail = Record<string, unknown>;

export default function HistoricalDetailPage() {
  const params = useParams();
  const key = typeof params.key === "string" ? params.key : "";
  const [data, setData] = useState<CrisisDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    apiGet<CrisisDetail>(`/advanced/historical-crises/${encodeURIComponent(key)}`)
      .then((d) => {
        setData(d);
        setErr(null);
      })
      .catch(() => {
        setData(null);
        setErr("Not found or API offline");
      })
      .finally(() => setLoading(false));
  }, [key]);

  if (!key) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[var(--wm-red)]">Invalid route</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[var(--wm-text-muted)]">Loading…</p>
      </main>
    );
  }

  if (err || !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-[var(--wm-red)]">{err}</p>
        <Link href="/historical" className="mt-4 inline-block text-[var(--wm-accent)]">
          Back
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/historical" className="text-sm text-[var(--wm-accent)]">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-light text-white">{String(data.name ?? key)}</h1>
      <p className="mt-2 text-[var(--wm-text-muted)]">{String(data.period ?? "")}</p>
      <div className="glass-panel mt-8 space-y-6 rounded-2xl p-6 text-sm text-[var(--wm-text-muted)]">
        <Section title="Trigger events" items={data.trigger_events as string[]} />
        <Section title="Policy response" items={data.policy_response as string[]} />
        <Section title="Lessons learned" items={data.lessons_learned as string[]} />
      </div>
    </main>
  );
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h2 className="mb-2 text-white">{title}</h2>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
