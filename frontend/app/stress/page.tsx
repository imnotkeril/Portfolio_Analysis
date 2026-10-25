"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Starter = { key: string; name: string };

export default function StressPage() {
  const [starters, setStarters] = useState<Starter[]>([]);
  const [key, setKey] = useState("inflation_shock");
  const [n, setN] = useState(400);
  const [data, setData] = useState<{
    transition_counts: Record<string, number>;
    sample_chains: { chain: string[]; timeline: number[]; total_impact: Record<string, number> }[];
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Starter[]>("/advanced/scenario-starters")
      .then(setStarters)
      .catch(() => setErr("API unavailable"));
  }, []);

  const run = async () => {
    setErr(null);
    try {
      const res = await apiPost<typeof data>("/advanced/scenario-chain", {
        starting_scenario: key,
        num_simulations: n,
      });
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  };

  const topTransitions = data
    ? Object.entries(data.transition_counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
    : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-light text-white">Stress scenario chains</h1>
      <p className="mb-8 text-[var(--wm-text-muted)]">
        Monte Carlo over scripted macro chains (same engine as Streamlit).
      </p>
      <div className="glass-panel mb-6 space-y-4 rounded-2xl p-6">
        <label className="block text-sm text-[var(--wm-text-muted)]">
          Starting scenario
          <select
            className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/50 px-3 py-2 text-white"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          >
            {starters.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-[var(--wm-text-muted)]">
          Simulations (max 5000)
          <input
            type="number"
            min={50}
            max={5000}
            className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/50 px-3 py-2 text-white"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          onClick={run}
          className="rounded-lg border border-white/20 px-6 py-2 text-sm text-white hover:border-[var(--wm-accent)]"
        >
          Simulate
        </button>
      </div>
      {err && <p className="text-sm text-[var(--wm-red)]">{err}</p>}
      {topTransitions.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="mb-4 text-lg text-white">Top transitions</h2>
          <ul className="space-y-2 text-sm text-[var(--wm-text-muted)]">
            {topTransitions.map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span>{k}</span>
                <span className="text-white">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
