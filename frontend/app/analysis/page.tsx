"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { apiGet, apiPost, portfolioFileStem, type AnalysisResult, type PortfolioSummary } from "@/lib/api";

function pct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(2)}%`;
}

function fmtRatio(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(2);
}

function AnalysisPageContent() {
  const searchParams = useSearchParams();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [pid, setPid] = useState("");
  const [benchmark, setBenchmark] = useState("SPY");
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
      .catch(() => setErr("Could not load portfolios (is API running?)"));
  }, [qp]);

  const chartData = useMemo(() => {
    if (!data?.timeseries) return [];
    return data.timeseries.map((r) => ({
      t: r.date.slice(0, 10),
      portfolio: r.portfolio_pct,
      benchmark: r.benchmark_pct ?? undefined,
    }));
  }, [data]);

  const run = async () => {
    if (!pid) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await apiPost<AnalysisResult>("/analysis/metrics", {
        portfolio_id: pid,
        start,
        end,
        benchmark,
        risk_free_rate: 0,
      });
      setData(res);
    } catch (e) {
      setData(null);
      setErr(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const m = data?.metrics;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-1 text-3xl font-light text-white">Our performance</h1>
      <p className="mb-8 text-[var(--wm-text-muted)]">Track record that speaks for itself</p>

      <div className="glass-panel mb-8 flex flex-wrap items-end gap-4 rounded-2xl p-4">
        <label className="text-sm text-[var(--wm-text-muted)]">
          Portfolio file
          <select
            className="ml-2 rounded-lg border border-[var(--wm-border)] bg-black/50 px-2 py-2 text-white"
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
        <label className="text-sm text-[var(--wm-text-muted)]">
          Benchmark
          <select
            className="ml-2 rounded-lg border border-[var(--wm-border)] bg-black/50 px-2 py-2 text-white"
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value)}
          >
            {["SPY", "QQQ", "DIA", "IWM", "VTI"].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[var(--wm-text-muted)]">
          Start
          <input
            type="date"
            className="ml-2 rounded-lg border border-[var(--wm-border)] bg-black/50 px-2 py-2 text-white"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="text-sm text-[var(--wm-text-muted)]">
          End
          <input
            type="date"
            className="ml-2 rounded-lg border border-[var(--wm-border)] bg-black/50 px-2 py-2 text-white"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={run}
          disabled={loading || !pid}
          className="rounded-lg border border-white/20 px-5 py-2 text-sm text-white hover:border-[var(--wm-accent)] disabled:opacity-40"
        >
          {loading ? "Loading…" : "Run analysis"}
        </button>
      </div>

      {err && <p className="mb-4 text-sm text-[var(--wm-red)]">{err}</p>}
      {data?.missing_tickers?.length ? (
        <p className="mb-4 text-sm text-[var(--wm-orange)]">
          Missing tickers: {data.missing_tickers.join(", ")}
        </p>
      ) : null}

      {m && (
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Kpi label="Total return" value={pct(m.total_return)} accent="neutral" />
          <Kpi label="Annual return" value={pct(m.annualized_return)} accent="neutral" />
          <Kpi label="Volatility" value={pct(m.volatility)} accent="neutral" />
          <Kpi label="Max drawdown" value={pct(m.max_drawdown)} accent="down" />
          <Kpi label="Sharpe" value={fmtRatio(m.sharpe_ratio)} accent="neutral" />
          <Kpi label="Sortino" value={fmtRatio(m.sortino_ratio)} accent="neutral" />
        </div>
      )}

      {chartData.length > 0 && (
        <div className="glass-panel rounded-2xl p-4">
          <p className="mb-4 text-center text-sm text-[var(--wm-text-muted)]">
            Cumulative return (%)
          </p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="t" tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: "#ccc" }}
                />
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  name="Portfolio"
                  stroke="#bf9ffb"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name={benchmark}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex justify-center gap-6 text-xs text-[var(--wm-text-muted)]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#bf9ffb]" /> Portfolio
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> {benchmark}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-[var(--wm-text-muted)]">Loading…</p>
        </main>
      }
    >
      <AnalysisPageContent />
    </Suspense>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "up" | "down" | "neutral";
}) {
  const color =
    accent === "up"
      ? "text-[var(--wm-green)]"
      : accent === "down"
        ? "text-[var(--wm-red)]"
        : "text-white";
  return (
    <div className="rounded-xl border border-[var(--wm-border)] bg-[var(--wm-card)]/60 p-4">
      <p className="text-xs text-[var(--wm-text-muted)]">{label}</p>
      <p className={`mt-2 text-lg font-medium ${color}`}>{value}</p>
    </div>
  );
}
