"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";

export default function CorrelationPage() {
  const [rows, setRows] = useState("AAPL\nMSFT\nGOOGL");
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [labels, setLabels] = useState<string[] | null>(null);
  const [matrix, setMatrix] = useState<(number | null)[][] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setErr(null);
    const tickers = rows
      .split("\n")
      .map((l) => l.trim().toUpperCase())
      .filter(Boolean);
    if (tickers.length < 2) {
      setErr("Need at least two tickers.");
      return;
    }
    try {
      const res = await apiPost<{ labels: string[]; matrix: (number | null)[][] }>(
        "/analysis/correlation",
        { tickers, start, end }
      );
      setLabels(res.labels);
      setMatrix(res.matrix);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
      setLabels(null);
      setMatrix(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-light text-white">Correlation matrix</h1>
      <p className="mb-8 text-[var(--wm-text-muted)]">Pearson correlation of daily returns.</p>
      <div className="glass-panel mb-6 space-y-4 rounded-2xl p-6">
        <label className="block text-sm text-[var(--wm-text-muted)]">
          Tickers (one per line)
          <textarea
            rows={6}
            className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/40 px-3 py-2 font-mono text-sm text-white"
            value={rows}
            onChange={(e) => setRows(e.target.value)}
          />
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
          className="rounded-lg border border-[var(--wm-accent)] px-6 py-2 text-sm text-[var(--wm-accent)]"
        >
          Compute
        </button>
      </div>
      {err && <p className="text-sm text-[var(--wm-red)]">{err}</p>}
      {labels && matrix && (
        <div className="overflow-x-auto rounded-2xl border border-[var(--wm-border)]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-[var(--wm-border)] bg-[var(--wm-card)] p-2 text-left text-[var(--wm-text-muted)]" />
                {labels.map((l) => (
                  <th
                    key={l}
                    className="border border-[var(--wm-border)] bg-[var(--wm-card)] p-2 text-[var(--wm-text-muted)]"
                  >
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((rowLabel, i) => (
                <tr key={rowLabel}>
                  <td className="border border-[var(--wm-border)] bg-[var(--wm-card)] p-2 font-medium text-white">
                    {rowLabel}
                  </td>
                  {matrix[i]?.map((cell, j) => (
                    <td
                      key={j}
                      className="border border-[var(--wm-border)] p-2 text-center text-[var(--wm-text-muted)]"
                      style={{
                        background:
                          cell == null
                            ? undefined
                            : `rgba(191,159,251,${Math.min(0.45, Math.abs(cell) * 0.35)})`,
                      }}
                    >
                      {cell == null ? "—" : cell.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
