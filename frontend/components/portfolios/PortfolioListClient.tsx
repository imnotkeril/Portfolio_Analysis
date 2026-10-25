"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiDelete,
  apiGet,
  apiPost,
  downloadPortfolioCsv,
  portfolioFileStem,
  type PortfolioFull,
  type PortfolioSummary,
} from "@/lib/api";
import { AllocationPie } from "@/components/create/AllocationPie";

type SortKey = "name" | "assets" | "updated";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function PortfolioListClient() {
  const [list, setList] = useState<PortfolioSummary[]>([]);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [selectedStem, setSelectedStem] = useState<string | null>(null);
  const [detail, setDetail] = useState<PortfolioFull | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dupName, setDupName] = useState("");

  const refresh = useCallback(() => {
    setErr(null);
    apiGet<PortfolioSummary[]>("/portfolios")
      .then((p) => {
        setList(p);
        setSelectedStem((prev) => {
          if (prev && p.some((x) => portfolioFileStem(x.filename) === prev)) return prev;
          return p[0] ? portfolioFileStem(p[0].filename) : null;
        });
      })
      .catch((e) => setErr(errMsg(e)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedStem) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    apiGet<PortfolioFull>(`/portfolios/${encodeURIComponent(selectedStem)}`)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (!cancelled) setErr(errMsg(e));
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStem]);

  const filteredSorted = useMemo(() => {
    let rows = list.filter((p) => p.name.toLowerCase().includes(filter.trim().toLowerCase()));
    rows = [...rows].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "assets") return b.asset_count - a.asset_count;
      return String(b.last_updated).localeCompare(String(a.last_updated));
    });
    return rows;
  }, [list, filter, sort]);

  const allocPie = useMemo(() => {
    if (!detail?.assets) return [];
    return detail.assets.map((a) => ({ name: a.ticker, value: a.weight }));
  }, [detail]);

  const sectorPie = useMemo(() => {
    if (!detail?.assets) return [];
    const m: Record<string, number> = {};
    for (const a of detail.assets) {
      const s = a.sector && a.sector !== "N/A" ? a.sector : "Unknown";
      m[s] = (m[s] ?? 0) + a.weight;
    }
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [detail]);

  const onExport = async (stem: string, displayName: string) => {
    try {
      await downloadPortfolioCsv(stem, displayName);
      setMsg("CSV download started.");
      setErr(null);
    } catch (e) {
      setErr(errMsg(e));
      setMsg(null);
    }
  };

  const onDuplicate = async (stem: string) => {
    if (!dupName.trim()) {
      setErr("Enter a name for the copy.");
      return;
    }
    try {
      await apiPost(`/portfolios/${encodeURIComponent(stem)}/duplicate`, { new_name: dupName.trim() });
      setMsg(`Duplicated as "${dupName.trim()}".`);
      setDupName("");
      refresh();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  const onDelete = async (stem: string, displayName: string) => {
    if (!window.confirm(`Delete portfolio "${displayName}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/portfolios/${encodeURIComponent(stem)}`);
      setMsg("Portfolio deleted.");
      if (selectedStem === stem) setSelectedStem(null);
      refresh();
    } catch (e) {
      setErr(errMsg(e));
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-light text-white">Portfolio list</h1>
          <p className="mt-1 text-[var(--wm-text-muted)]">
            All saved portfolios — open in analysis, export, duplicate, or remove.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="self-start rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:border-[var(--wm-accent)]"
        >
          Refresh
        </button>
      </div>

      {msg && <p className="mb-4 text-sm text-[var(--wm-green)]">{msg}</p>}
      {err && <p className="mb-4 text-sm text-[var(--wm-red)]">{err}</p>}

      {!list.length && !err ? (
        <div className="glass-panel rounded-2xl p-8 text-center text-[var(--wm-text-muted)]">
          <p>No portfolios yet.</p>
          <Link href="/create" className="mt-4 inline-block text-[var(--wm-accent)]">
            Create a portfolio
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="glass-panel rounded-2xl p-4 lg:col-span-2">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                placeholder="Filter by name…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--wm-border)] bg-black/40 px-3 py-2 text-sm text-white"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-lg border border-[var(--wm-border)] bg-black/50 px-3 py-2 text-sm text-white"
              >
                <option value="name">Sort: name</option>
                <option value="assets">Sort: assets</option>
                <option value="updated">Sort: updated</option>
              </select>
            </div>
            <div className="max-h-[min(70vh,560px)] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="sticky top-0 bg-[var(--wm-card)] text-[var(--wm-text-muted)]">
                    <th className="p-2">Name</th>
                    <th className="p-2">#</th>
                    <th className="p-2 hidden sm:table-cell">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSorted.map((p) => {
                    const stem = portfolioFileStem(p.filename);
                    const active = selectedStem === stem;
                    return (
                      <tr
                        key={p.filename}
                        className={`cursor-pointer border-t border-[var(--wm-border)] transition ${
                          active ? "bg-[var(--wm-accent)]/10" : "hover:bg-white/5"
                        }`}
                        onClick={() => setSelectedStem(stem)}
                      >
                        <td className="p-2 font-medium text-white">{p.name}</td>
                        <td className="p-2 text-[var(--wm-text-muted)]">{p.asset_count}</td>
                        <td className="p-2 text-[var(--wm-text-muted)] hidden sm:table-cell">
                          {p.last_updated}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredSorted.length === 0 && list.length > 0 && (
                <p className="p-4 text-center text-sm text-[var(--wm-text-muted)]">No matches.</p>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 lg:col-span-3">
            {!selectedStem ? (
              <p className="text-[var(--wm-text-muted)]">Select a portfolio.</p>
            ) : loadingDetail ? (
              <p className="text-[var(--wm-text-muted)]">Loading…</p>
            ) : detail ? (
              <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-light text-white">{detail.name}</h2>
                    {detail.description && (
                      <p className="mt-1 text-sm text-[var(--wm-text-muted)]">{detail.description}</p>
                    )}
                    {detail.last_updated && (
                      <p className="mt-1 text-xs text-[var(--wm-text-dim)]">Updated {detail.last_updated}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/analysis?p=${encodeURIComponent(selectedStem)}`}
                      className="rounded-lg border border-[var(--wm-accent)] px-3 py-1.5 text-sm text-[var(--wm-accent)]"
                    >
                      Analyze
                    </Link>
                    <Link
                      href={`/optimize?p=${encodeURIComponent(selectedStem)}`}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white"
                    >
                      Optimize
                    </Link>
                    <button
                      type="button"
                      onClick={() => onExport(selectedStem, detail.name)}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="mb-6 max-h-52 overflow-auto rounded-lg border border-[var(--wm-border)]">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[var(--wm-text-muted)]">
                        <th className="p-2">Ticker</th>
                        <th className="p-2">Weight</th>
                        <th className="p-2 hidden md:table-cell">Name</th>
                        <th className="p-2 hidden md:table-cell">Sector</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.assets.map((a) => (
                        <tr key={a.ticker} className="border-t border-[var(--wm-border)]">
                          <td className="p-2 text-white">{a.ticker}</td>
                          <td className="p-2">{(a.weight * 100).toFixed(2)}%</td>
                          <td className="p-2 hidden md:table-cell text-[var(--wm-text-muted)]">
                            {a.name ?? ""}
                          </td>
                          <td className="p-2 hidden md:table-cell text-[var(--wm-text-muted)]">
                            {a.sector ?? ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <AllocationPie data={allocPie} />
                  {sectorPie.length > 1 && <AllocationPie data={sectorPie} title="By sector" />}
                </div>

                <div className="mt-8 border-t border-[var(--wm-border)] pt-6">
                  <h3 className="mb-3 text-sm font-medium text-[var(--wm-text-muted)]">Duplicate</h3>
                  <div className="flex flex-wrap items-end gap-2">
                    <input
                      placeholder="New portfolio name"
                      value={dupName}
                      onChange={(e) => setDupName(e.target.value)}
                      className="min-w-[200px] flex-1 rounded-lg border border-[var(--wm-border)] bg-black/40 px-3 py-2 text-sm text-white"
                    />
                    <button
                      type="button"
                      onClick={() => onDuplicate(selectedStem)}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
                    >
                      Duplicate
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(selectedStem, detail.name)}
                    className="mt-6 text-sm text-[var(--wm-red)] hover:underline"
                  >
                    Delete portfolio…
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[var(--wm-red)]">Could not load portfolio.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
