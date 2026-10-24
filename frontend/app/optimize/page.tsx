"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, apiPost, portfolioFileStem, type PortfolioSummary } from "@/lib/api";

const METHODS = [
  { v: "maximum_sharpe", label: "Maximum Sharpe" },
  { v: "minimum_variance", label: "Minimum variance" },
  { v: "risk_parity", label: "Risk parity" },
  { v: "markowitz", label: "Markowitz" },
  { v: "equal_weight", label: "Equal weight" },
];

function OptimizePageContent() {
  const searchParams = useSearchParams();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [pid, setPid] = useState("");
  const [method, setMethod] = useState("maximum_sharpe");
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const qp = searchParams.get("p") || searchParams.get("portfolio");

  useEffect(() => {
    apiGet<PortfolioSummary[]>("/portfolios")
      .then((list) => {
        setPortfolios(list);
        const want = qp?.trim();
        const match =
          want && list.some((p) => portfolioFileStem(p.filename) === want) ? want : null;
        if (match) setPid(match);
        else if (list[0]) setPid(portfolioFileStem(list[0].filename));
        else setPid("");
      })
      .catch(() => setErr("Could not load portfolios"));
  }, [qp]);

  const run = async () => {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await apiPost<Record<string, unknown>>("/optimization/run", {
        portfolio_id: pid,
        method,
        start,
        end,
        risk_free_rate: 0,
        min_weight: 0,
        max_weight: 1,
      });
      setResult(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  const weights =
    result && typeof result.optimal_weights === "object" && result.optimal_weights !== null
      ? (result.optimal_weights as Record<string, number>)
      : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-light text-white">Portfolio optimization</h1>
      <p className="mb-8 text-[var(--wm-text-muted)]">Mean-variance and risk-based methods on your universe.</p>

      <div className="glass-panel mb-6 space-y-4 rounded-2xl p-6">
        <label className="block text-sm text-[var(--wm-text-muted)]">
          Portfolio
          <select
            className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/50 px-3 py-2 text-white"
            value={pid}
            onChange={(e) => setPid(e.target.value)}
          >
            {portfolios.map((p) => (
              <option key={p.filename} value={portfolioFileStem(p.filename)}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-[var(--wm-text-muted)]">
          Method
          <select
            className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/50 px-3 py-2 text-white"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {METHODS.map((m) => (
              <option key={m.v} value={m.v}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-4">
          <label className="flex-1 text-sm text-[var(--wm-text-muted)]">
            Start
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/50 px-3 py-2 text-white"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="flex-1 text-sm text-[var(--wm-text-muted)]">
            End
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/50 px-3 py-2 text-white"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading || !pid}
          className="rounded-lg border border-[var(--wm-accent)] px-6 py-2 text-sm text-[var(--wm-accent)] hover:bg-[var(--wm-accent)]/10 disabled:opacity-40"
        >
          {loading ? "Optimizing…" : "Run optimization"}
        </button>
      </div>

      {err && <p className="text-sm text-[var(--wm-red)]">{err}</p>}

      {result && "error" in result && result.error != null ? (
        <p className="text-sm text-[var(--wm-red)]">{String(result.error)}</p>
      ) : null}

      {weights && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="mb-4 text-lg text-white">Suggested weights</h2>
          <ul className="space-y-2">
            {Object.entries(weights)
              .sort((a, b) => b[1] - a[1])
              .map(([t, w]) => (
                <li key={t} className="flex justify-between text-sm text-[var(--wm-text-muted)]">
                  <span className="text-white">{t}</span>
                  <span>{(w * 100).toFixed(2)}%</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </main>
  );
}

export default function OptimizePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-[var(--wm-text-muted)]">Loading…</p>
        </main>
      }
    >
      <OptimizePageContent />
    </Suspense>
  );
}
