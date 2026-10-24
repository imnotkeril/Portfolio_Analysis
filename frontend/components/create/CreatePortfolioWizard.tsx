"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  apiGet,
  apiPost,
  portfolioFileStem,
  type PortfolioFull,
  type PortfolioSummary,
  type TemplateDetail,
  type TemplateSummary,
} from "@/lib/api";
import { builtinTemplateDetail, builtinTemplateSummaries } from "@/lib/builtinTemplates";
import { AllocationPie } from "./AllocationPie";
import { CsvImportPanel } from "./CsvImportPanel";
import { HelpTooltip, LabelWithHelp } from "./HelpTooltip";
import {
  WizardHowToCreate,
  WizardManualEntryHelp,
  WizardSettingsConfigure,
  WizardStep2WhichMethod,
  WizardTextInputDeepHelp,
  WizardWhatAreTemplates,
} from "./WizardHelpPanels";

type AssetMethod = "template" | "text" | "search" | "csv";
type CheckRow = { ticker: string; weight: number; found: boolean };
type SearchHit = Record<string, string | number | undefined>;
type LocalAsset = { ticker: string; weight: number };

const TOTAL_STEPS = 5;
const BTN_PRIMARY =
  "rounded-lg bg-[#b194ff] px-6 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35";
const BTN_GHOST =
  "rounded-lg border border-white/25 px-6 py-3 text-sm font-medium text-white transition hover:border-[var(--wm-accent)]";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function applyCash(assets: LocalAsset[], cashPct: number): LocalAsset[] {
  const c = Math.min(100, Math.max(0, cashPct)) / 100;
  if (c <= 0) return assets.map((a) => ({ ...a }));
  const scaled = assets.map((a) => ({ ...a, weight: a.weight * (1 - c) }));
  scaled.push({ ticker: "CASH", weight: c });
  return scaled;
}

/** Tile titles aligned with Streamlit “Choose Input Method”. */
function methodTileTitle(m: AssetMethod): string {
  switch (m) {
    case "template":
      return "Use Template";
    case "text":
      return "Text Input";
    case "search":
      return "Manual Entry";
    case "csv":
      return "Upload File";
    default:
      return m;
  }
}

function methodTileSubtitle(m: AssetMethod): string {
  switch (m) {
    case "template":
      return "Pre-built strategies";
    case "text":
      return "Quick paste, multiple formats";
    case "search":
      return "Search ticker or company, add one by one";
    case "csv":
      return "CSV file from disk or Excel export";
    default:
      return "";
  }
}

export function CreatePortfolioWizard() {
  const [step, setStep] = useState(1);
  const [portfolioName, setPortfolioName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [initialInvestment, setInitialInvestment] = useState(100_000);
  const [nameStatus, setNameStatus] = useState<"idle" | "ok" | "taken">("idle");

  const [assetMethod, setAssetMethod] = useState<AssetMethod | null>(null);

  const [summaries, setSummaries] = useState<TemplateSummary[]>([]);
  const [tid, setTid] = useState("");
  const [templateDetail, setTemplateDetail] = useState<(TemplateDetail & { tags?: string[] }) | null>(null);

  const [textBody, setTextBody] = useState("");
  const [textRows, setTextRows] = useState<CheckRow[] | null>(null);
  const [textFormatTab, setTextFormatTab] = useState<"pct" | "dec" | "num" | "eq">("pct");

  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [pick, setPick] = useState(0);
  const [searchWeightPct, setSearchWeightPct] = useState(10);
  const [searchAssets, setSearchAssets] = useState<LocalAsset[]>([]);

  const [optFetchInfo, setOptFetchInfo] = useState(true);
  const [optNormalize, setOptNormalize] = useState(true);
  const [optPrices, setOptPrices] = useState(true);
  const [optShares, setOptShares] = useState(true);
  const [cashPct, setCashPct] = useState(0);
  const [portfolioMode, setPortfolioMode] = useState<"buyhold" | "transactions">("buyhold");

  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [created, setCreated] = useState<PortfolioFull | null>(null);
  const [createdStem, setCreatedStem] = useState<string | null>(null);

  useEffect(() => {
    apiGet<TemplateSummary[]>("/portfolios/templates")
      .then((s) => {
        setSummaries(s);
        if (s[0]) setTid(s[0].id);
      })
      .catch(() => {
        const b = builtinTemplateSummaries();
        setSummaries(b);
        if (b[0]) setTid(b[0].id);
      });
  }, []);

  useEffect(() => {
    if (!tid) return;
    apiGet<TemplateDetail>(`/portfolios/templates/${encodeURIComponent(tid)}`)
      .then((d) => setTemplateDetail(d))
      .catch(() => setTemplateDetail(builtinTemplateDetail(tid)));
  }, [tid]);

  useEffect(() => {
    if (step !== 1) return;
    const name = portfolioName.trim();
    if (!name) {
      setNameStatus("idle");
      setHint(null);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        try {
          const list = await apiGet<PortfolioSummary[]>("/portfolios");
          const taken = list.some((p) => p.name.trim().toLowerCase() === name.toLowerCase());
          setNameStatus(taken ? "taken" : "ok");
          if (taken) {
            setErr("A portfolio with this name already exists.");
            setHint(null);
          } else {
            setErr(null);
            setHint("Portfolio name is available");
          }
        } catch (e) {
          setErr(errMsg(e));
          setNameStatus("idle");
        }
      })();
    }, 450);
    return () => clearTimeout(t);
  }, [portfolioName, step]);

  useEffect(() => {
    if (step !== 3 || assetMethod !== "text") return;
    if (!textBody.trim()) {
      setTextRows(null);
      setErr(null);
      setHint(null);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await apiPost<{ rows: CheckRow[] }>("/portfolios/check-text", { text: textBody });
          setTextRows(res.rows);
          if (!res.rows.length) {
            setErr("No tickers were recognized. Please check your input format.");
            setHint(null);
          } else {
            setErr(null);
            setHint(`Recognized ${res.rows.length} assets.`);
          }
        } catch (e) {
          setErr(errMsg(e));
        }
      })();
    }, 500);
    return () => clearTimeout(t);
  }, [textBody, step, assetMethod]);

  const symbolOf = (h: SearchHit) => String(h.symbol ?? h.Symbol ?? "");

  useEffect(() => {
    if (step !== 3 || assetMethod !== "search") return;
    const query = q.trim();
    if (!query) {
      setHits([]);
      setErr(null);
      setHint(null);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        try {
          const list = await apiGet<SearchHit[]>(`/tickers/search?q=${encodeURIComponent(query)}&limit=10`);
          setHits(list);
          setPick(0);
          if (!list.length) {
            setErr(`Nothing found for '${query}'.`);
            setHint(null);
          } else {
            setErr(null);
            const top = list[0];
            const sn = symbolOf(top);
            const nm = String(top.name ?? "");
            setHint(
              `Found ${list.length} assets.${nm ? ` ${sn} — ${nm} is available to add.` : ""}`,
            );
          }
        } catch (e) {
          setErr(errMsg(e));
        }
      })();
    }, 400);
    return () => clearTimeout(t);
  }, [q, step, assetMethod]);

  const addSearchAsset = () => {
    const h = hits[pick];
    if (!h) return;
    const sym = symbolOf(h);
    if (!sym) return;
    setSearchAssets((p) => [...p, { ticker: sym.toUpperCase(), weight: searchWeightPct / 100 }]);
    setHint(`Added ${sym}`);
  };

  const normalizeSearch = () => {
    const s = searchAssets.reduce((a, b) => a + b.weight, 0);
    if (s <= 0) return;
    setSearchAssets(searchAssets.map((x) => ({ ...x, weight: x.weight / s })));
    setHint("Weights normalized");
  };

  const collectBaseAssets = useCallback((): LocalAsset[] | null => {
    if (!assetMethod) return null;
    if (assetMethod === "template") {
      if (!templateDetail?.assets?.length) return null;
      return templateDetail.assets.map((a) => ({ ticker: a.ticker, weight: a.weight }));
    }
    if (assetMethod === "text") {
      if (!textRows?.length) return null;
      const rows = textRows.filter((r) => r.found);
      if (!rows.length) return null;
      return rows.map((r) => ({ ticker: r.ticker, weight: r.weight }));
    }
    if (assetMethod === "search") {
      if (!searchAssets.length) return null;
      return searchAssets.map((a) => ({ ...a }));
    }
    return null;
  }, [assetMethod, templateDetail, textRows, searchAssets]);

  const canProceed3 = useMemo(() => {
    if (!assetMethod) return false;
    if (assetMethod === "csv") return true;
    const a = collectBaseAssets();
    return Boolean(a && a.length > 0);
  }, [assetMethod, collectBaseAssets]);

  const summaryMethod = assetMethod ? methodTileTitle(assetMethod) : "—";

  const textFormatExample = useMemo(() => {
    switch (textFormatTab) {
      case "pct":
        return "AAPL:40%, MSFT:30%, GOOGL:30%";
      case "dec":
        return "AAPL 0.4, MSFT 0.3, GOOGL 0.3";
      case "num":
        return "AAPL 40, MSFT 30, GOOGL 30";
      case "eq":
        return "AAPL, MSFT, GOOGL";
      default:
        return "";
    }
  }, [textFormatTab]);
  const summaryAssetCount = useMemo(() => collectBaseAssets()?.length ?? 0, [collectBaseAssets]);

  const submitCreate = async () => {
    setErr(null);
    setHint(null);
    const base = collectBaseAssets();
    if (!base?.length) {
      setErr("No assets to save.");
      return;
    }
    const invested = applyCash(base, cashPct);
    setCreating(true);
    try {
      const res = await apiPost<{
        portfolio: PortfolioFull;
        invalid_tickers?: string[];
      }>("/portfolios/create-from-assets", {
        name: portfolioName.trim(),
        description: description.trim(),
        assets: invested.map((a) => ({ ticker: a.ticker, weight: a.weight })),
        base_currency: currency,
        initial_investment: initialInvestment,
        portfolio_mode: portfolioMode,
        creation_method: assetMethod ?? undefined,
      });
      const list = await apiGet<PortfolioSummary[]>("/portfolios");
      const row = list.find((p) => p.name === portfolioName.trim());
      setCreatedStem(row ? portfolioFileStem(row.filename) : null);
      setCreated(res.portfolio);
      setStep(5);
      if (res.invalid_tickers?.length) {
        setHint(`Excluded invalid tickers: ${res.invalid_tickers.join(", ")}`);
      }
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setCreating(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setPortfolioName("");
    setCurrency("USD");
    setDescription("");
    setInitialInvestment(100_000);
    setNameStatus("idle");
    setAssetMethod(null);
    setTextRows(null);
    setSearchAssets([]);
    setHits([]);
    setCreated(null);
    setCreatedStem(null);
    setErr(null);
    setHint(null);
  };

  const progressPct = (step / TOTAL_STEPS) * 100;

  const pieTemplate = useMemo(() => {
    if (!templateDetail?.assets) return [];
    return templateDetail.assets.map((a) => ({ name: a.ticker, value: a.weight }));
  }, [templateDetail]);

  const pieSearch = useMemo(() => {
    const t = searchAssets.reduce((s, a) => s + a.weight, 0);
    if (t <= 0) return [];
    return searchAssets.map((a) => ({ name: a.ticker, value: a.weight / t }));
  }, [searchAssets]);

  const textTotalW = textRows ? textRows.filter((r) => r.found).reduce((s, r) => s + r.weight, 0) : 0;
  const textStatus =
    textRows && textRows.length
      ? Math.abs(textTotalW - 1) < 0.02
        ? "Perfect"
        : "Will normalize on save"
      : "—";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold text-white">Create New Portfolio</h1>

      <details className="mb-6 rounded-xl border border-[var(--wm-border)] bg-black/30 px-4 py-3 text-sm text-[var(--wm-text-muted)]">
        <summary className="cursor-pointer text-white">How to Create a Portfolio</summary>
        <WizardHowToCreate />
      </details>

      <div className="mb-2 text-xs uppercase tracking-wide text-[var(--wm-text-muted)]">Portfolio Creation</div>
      <div className="mb-1 text-sm text-white">
        Step {step} of {TOTAL_STEPS}
      </div>
      <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      {err && <p className="mb-4 rounded-lg bg-red-950/50 px-4 py-2 text-sm text-[var(--wm-red)]">{err}</p>}
      {hint && <p className="mb-4 rounded-lg bg-emerald-950/40 px-4 py-2 text-sm text-emerald-200">{hint}</p>}

      {step === 1 && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="mb-4 text-xl font-medium text-white">Step 1: Portfolio Information</h2>
          <details className="mb-6 rounded-lg border border-[var(--wm-border)] bg-black/20 px-3 py-2 text-sm">
            <summary className="cursor-pointer text-[var(--wm-text-muted)]">What information do I need?</summary>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[var(--wm-text-muted)]">
              <li>
                <strong className="text-white/90">Portfolio name</strong> — required; must be unique (you&apos;ll see a
                warning if it already exists).
              </li>
              <li>
                <strong className="text-white/90">Description</strong> — optional notes for your own reference.
              </li>
              <li>
                <strong className="text-white/90">Base currency</strong> — reporting currency for values in the app.
              </li>
              <li>
                <strong className="text-white/90">Initial investment</strong> — used for estimated dollar amounts and
                optional share counts; saved weights stay as proportions.
              </li>
            </ul>
          </details>
          <div className="grid gap-4 md:grid-cols-2">
            <LabelWithHelp
              label="Portfolio Name *"
              hint="Unique name for this portfolio. Duplicate names are blocked before you continue."
            >
              <input
                className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/40 px-3 py-2 text-white"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                placeholder="My strategy"
              />
            </LabelWithHelp>
            <LabelWithHelp label="Base Currency" hint="Currency used when showing portfolio totals and estimates.">
              <select
                className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/50 px-3 py-2 text-white"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {["USD", "EUR", "GBP", "CHF"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </LabelWithHelp>
            <LabelWithHelp
              label="Description"
              hint="Optional. Shown in lists and helps you remember what this portfolio is for."
              className="md:col-span-2"
            >
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/40 px-3 py-2 text-white"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </LabelWithHelp>
            <LabelWithHelp
              label="Initial Investment ($)"
              hint="Total starting capital for estimates (position values, optional share quantities). Weights are still saved as fractions of the investable part."
              className="md:col-span-2"
            >
              <input
                type="number"
                min={0}
                step={1000}
                className="mt-1 w-full max-w-xs rounded-lg border border-[var(--wm-border)] bg-black/40 px-3 py-2 text-white"
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(Number(e.target.value) || 0)}
              />
            </LabelWithHelp>
          </div>
          <div className="mt-8 flex flex-wrap justify-between gap-4">
            <Link href="/" className={BTN_GHOST}>
              Cancel
            </Link>
            <button
              type="button"
              className={BTN_PRIMARY}
              disabled={!portfolioName.trim() || nameStatus !== "ok"}
              onClick={() => setStep(2)}
            >
              Next Step →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="mb-2 text-xl font-medium text-white">Step 2: Choose Input Method</h2>
          <p className="mb-4 text-sm text-[var(--wm-text-muted)]">Pick one approach. You can change it until you continue.</p>
          <details className="mb-6 rounded-lg border border-[var(--wm-border)] bg-black/20 px-3 py-2 text-sm">
            <summary className="cursor-pointer text-[var(--wm-text-muted)]">Which method should I choose?</summary>
            <WizardStep2WhichMethod />
          </details>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["template", "text", "search", "csv"] as AssetMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setAssetMethod(m)}
                className={`rounded-xl border px-4 py-4 text-left text-sm transition ${
                  assetMethod === m
                    ? "border-[var(--wm-accent)] bg-[var(--wm-accent)]/10 text-white"
                    : "border-[var(--wm-border)] text-[var(--wm-text-muted)] hover:border-white/30"
                }`}
              >
                <span className="font-medium text-white">{methodTileTitle(m)}</span>
                <span className="mt-1 block text-xs text-[var(--wm-text-muted)]">{methodTileSubtitle(m)}</span>
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-between gap-4">
            <button type="button" className={BTN_GHOST} onClick={() => setStep(1)}>
              ← Previous
            </button>
            <button type="button" className={BTN_PRIMARY} disabled={!assetMethod} onClick={() => setStep(3)}>
              Next Step →
            </button>
          </div>
        </div>
      )}

      {step === 3 && assetMethod && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="mb-2 text-xl font-medium text-white">Step 3: Add Your Assets</h2>
          <p className="mb-6 text-sm text-[var(--wm-text-muted)]">
            {assetMethod === "template" && "Start with a proven strategy and customize as needed."}
            {assetMethod === "text" && "Enter your portfolio assets (one of these formats):"}
            {assetMethod === "search" &&
              "Search for assets (company name or ticker). Results update as you type; pick a row, set weight, add."}
            {assetMethod === "csv" && "Upload a CSV or Excel file with your portfolio data (save Excel as CSV)."}
          </p>

          {assetMethod === "template" && (
            <div>
              <details className="mb-4 rounded-lg border border-[var(--wm-border)] bg-black/20 px-3 py-2 text-sm" open>
                <summary className="cursor-pointer text-[var(--wm-text-muted)]">What are portfolio templates?</summary>
                <WizardWhatAreTemplates />
              </details>
              <LabelWithHelp
                label="Choose a template"
                hint="Pre-built weights you can save as a new portfolio and edit later."
                className="mb-4"
              >
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/50 px-3 py-2 text-white"
                  value={tid}
                  onChange={(e) => setTid(e.target.value)}
                >
                  {summaries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {s.description}
                    </option>
                  ))}
                </select>
              </LabelWithHelp>
              {templateDetail && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 md:col-span-2">
                    <p className="text-sm text-[var(--wm-text-muted)]">{templateDetail.description}</p>
                    {templateDetail.tags && templateDetail.tags.length > 0 && (
                      <ul className="mt-3 text-sm text-white">
                        {templateDetail.tags.map((t) => (
                          <li key={t}>• {t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              {templateDetail && templateDetail.assets.length > 0 && (
                <details className="mt-4 rounded-lg border border-[var(--wm-border)] bg-black/20 px-3 py-2 text-sm" open>
                  <summary className="cursor-pointer text-[var(--wm-text-muted)]">Template Preview</summary>
                  <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--wm-border)]">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[var(--wm-border)] text-[var(--wm-text-muted)]">
                          <th className="p-2">Ticker</th>
                          <th className="p-2">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templateDetail.assets.map((a) => (
                          <tr key={a.ticker} className="border-t border-[var(--wm-border)]">
                            <td className="p-2 text-white">{a.ticker}</td>
                            <td className="p-2 text-white">{(a.weight * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
              {templateDetail && (
                <p className="mt-4 rounded-lg bg-emerald-950/40 px-4 py-2 text-sm text-emerald-100">
                  Template contains {templateDetail.assets.length} assets.
                </p>
              )}
              {pieTemplate.length > 0 && (
                <div className="mt-4 max-w-md">
                  <AllocationPie data={pieTemplate} title="Allocation chart" />
                </div>
              )}
            </div>
          )}

          {assetMethod === "text" && (
            <div>
              <details className="mb-4 rounded-lg border border-[var(--wm-border)] bg-black/20 px-3 py-2 text-sm" open>
                <summary className="cursor-pointer text-[var(--wm-text-muted)]">How does text input work?</summary>
                <WizardTextInputDeepHelp />
              </details>
              <div className="mb-3 flex flex-wrap gap-1 border-b border-[var(--wm-border)] text-xs">
                {(
                  [
                    ["pct", "Percentages"],
                    ["dec", "Decimals"],
                    ["num", "Numbers"],
                    ["eq", "Equal Weight"],
                  ] as const
                ).map(([key, lab]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTextFormatTab(key)}
                    className={`border-b-2 px-3 py-2 font-medium transition ${
                      textFormatTab === key
                        ? "border-[var(--wm-accent)] text-white"
                        : "border-transparent text-[var(--wm-text-muted)] hover:text-white/80"
                    }`}
                  >
                    {lab}
                  </button>
                ))}
              </div>
              <div className="mb-4 rounded-lg bg-black/40 px-3 py-2 font-mono text-sm">
                <span className="text-cyan-300">{textFormatExample}</span>
              </div>
              <LabelWithHelp
                label="Portfolio Assets:"
                hint="Paste or type tickers with weights. Parsing and ticker checks run automatically after a short pause."
              >
                <textarea
                  rows={8}
                  className="mb-4 mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/40 px-3 py-2 font-mono text-sm text-white"
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  placeholder="Enter tickers and weights here... Example: AAPL 30%, MSFT 25%, GOOGL 20%, AMZN 15%, TSLA 10%"
                />
              </LabelWithHelp>
              {textRows && textRows.length > 0 && (
                <div className="mt-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--wm-text-muted)]">
                        <th className="p-2">Ticker</th>
                        <th className="p-2">Weight</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {textRows.map((r) => (
                        <tr key={r.ticker} className="border-t border-[var(--wm-border)]">
                          <td className="p-2 text-white">{r.ticker}</td>
                          <td className="p-2">{(r.weight * 100).toFixed(1)}%</td>
                          <td className="p-2">{r.found ? "Found" : "Not found"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-[var(--wm-text-muted)]">Assets</p>
                      <p className="text-lg text-white">{textRows.filter((r) => r.found).length}</p>
                    </div>
                    <div>
                      <p className="text-[var(--wm-text-muted)]">Total weight</p>
                      <p className="text-lg text-white">{(textTotalW * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[var(--wm-text-muted)]">Status</p>
                      <p className="text-lg text-white">{textStatus}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {assetMethod === "search" && (
            <div>
              <details className="mb-4 rounded-lg border border-[var(--wm-border)] bg-black/20 px-3 py-2 text-sm" open>
                <summary className="cursor-pointer text-[var(--wm-text-muted)]">How does manual entry work?</summary>
                <WizardManualEntryHelp />
              </details>
              <div className="mb-4">
                <LabelWithHelp
                  label="Search for assets (enter company name or ticker)"
                  hint="Type to search; pick a symbol from the list, set a weight, then add to your draft portfolio."
                >
                  <input
                    className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/40 px-3 py-2 text-white"
                    placeholder="e.g. Microsoft or MSFT"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </LabelWithHelp>
                <p className="mt-1 text-xs text-[var(--wm-text-dim)]">Search runs automatically while you type.</p>
              </div>
              {hits.length > 0 && (
                <>
                  <table className="mb-4 w-full text-left text-sm text-[var(--wm-text-muted)]">
                    <thead>
                      <tr>
                        <th className="p-2">Symbol</th>
                        <th className="p-2">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hits.map((h, i) => (
                        <tr key={i} className="border-t border-[var(--wm-border)]">
                          <td className="p-2 text-white">{symbolOf(h)}</td>
                          <td className="p-2">{String(h.name ?? "")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <LabelWithHelp
                    label="Select an asset to add"
                    hint="Choose the exact listing you want from the search results before adding."
                    className="mb-2"
                  >
                    <select
                      className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/50 px-3 py-2 text-white"
                      value={pick}
                      onChange={(e) => setPick(Number(e.target.value))}
                    >
                      {hits.map((h, i) => (
                        <option key={i} value={i}>
                          {symbolOf(h)} — {String(h.name ?? "")}
                        </option>
                      ))}
                    </select>
                  </LabelWithHelp>
                  <LabelWithHelp
                    label={`Weight (%) (${searchWeightPct}%)`}
                    hint="Allocation for this line before normalization. Total across assets should reflect your intent; use Normalize on the chart if needed."
                    className="mb-4"
                  >
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={searchWeightPct}
                      onChange={(e) => setSearchWeightPct(Number(e.target.value))}
                      className="mt-1 block w-full max-w-xs accent-red-500"
                    />
                  </LabelWithHelp>
                  <button type="button" onClick={addSearchAsset} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white">
                    Add asset
                  </button>
                </>
              )}
              {searchAssets.length > 0 && (
                <div className="mt-6">
                  <AllocationPie data={pieSearch} />
                  <button type="button" className={`mt-4 ${BTN_PRIMARY}`} onClick={normalizeSearch}>
                    Normalize weights
                  </button>
                </div>
              )}
            </div>
          )}

          {assetMethod === "csv" && (
            <CsvImportPanel
              flashOk={(m) => setHint(m)}
              flashErr={(m) => setErr(m)}
              defaultPortfolioName={portfolioName}
              onImported={(p) => {
                setCreated(p);
                void (async () => {
                  try {
                    const list = await apiGet<PortfolioSummary[]>("/portfolios");
                    const row = list.find((x) => x.name === p.name);
                    setCreatedStem(row ? portfolioFileStem(row.filename) : null);
                  } catch {
                    setCreatedStem(null);
                  }
                })();
                setStep(5);
              }}
            />
          )}

          {assetMethod !== "csv" && (
            <div className="mt-8 flex flex-wrap justify-between gap-4">
              <button type="button" className={BTN_GHOST} onClick={() => setStep(2)}>
                ← Previous
              </button>
              <button type="button" className={BTN_PRIMARY} disabled={!canProceed3} onClick={() => setStep(4)}>
                Next Step →
              </button>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="mb-2 text-xl font-medium text-white">Step 4: Portfolio Settings &amp; Review</h2>
          <details className="mb-6 rounded-lg border border-[var(--wm-border)] bg-black/20 px-3 py-2 text-sm">
            <summary className="cursor-pointer text-[var(--wm-text-muted)]">What settings should I configure?</summary>
            <WizardSettingsConfigure />
          </details>

          <h3 className="mb-3 text-sm font-medium text-white">Portfolio Options</h3>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  "Fetch company information",
                  "Automatically get company names, sectors, and market data",
                  optFetchInfo,
                  setOptFetchInfo,
                ],
                [
                  "Update current prices",
                  "Fetch latest market prices for all assets",
                  optPrices,
                  setOptPrices,
                ],
                [
                  "Auto-normalize weights",
                  "Automatically adjust weights to sum to 100%",
                  optNormalize,
                  setOptNormalize,
                ],
                [
                  "Calculate share quantities",
                  "Estimate share counts from initial investment and latest prices",
                  optShares,
                  setOptShares,
                ],
              ] as const
            ).map(([label, hint, val, set]) => (
              <label key={label} className="flex cursor-pointer items-start gap-2 text-sm text-white">
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) => set(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
                />
                <span className="inline-flex flex-wrap items-center gap-0">
                  {label}
                  <HelpTooltip text={hint} />
                </span>
              </label>
            ))}
          </div>

          <h3 className="mb-3 text-sm font-medium text-white">Cash Management</h3>
          <div className="mb-6">
            <LabelWithHelp
              label={`Planned Cash Allocation (%) — ${cashPct}%`}
              hint="Percentage kept as cash (CASH). The rest is allocated across your tickers before normalization."
            >
              <input
                type="range"
                min={0}
                max={100}
                value={cashPct}
                onChange={(e) => setCashPct(Number(e.target.value))}
                className="mt-2 block w-full accent-red-500"
              />
            </LabelWithHelp>
            <p className="mt-2 text-lg text-white">
              ${((initialInvestment * cashPct) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} cash
            </p>
            <p className="mt-2 rounded-lg bg-blue-950/40 px-4 py-2 text-sm text-blue-100">
              Remaining for investments: {100 - cashPct}%
            </p>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-sm text-[var(--wm-text-muted)]">How do you want to manage this portfolio?</p>
            <label className="mr-6 inline-flex items-center gap-2 text-white">
              <input
                type="radio"
                name="pmode"
                checked={portfolioMode === "buyhold"}
                onChange={() => setPortfolioMode("buyhold")}
                className="accent-[var(--wm-accent)]"
              />
              Buy-and-Hold
            </label>
            <label className="inline-flex items-center gap-2 text-white">
              <input
                type="radio"
                name="pmode"
                checked={portfolioMode === "transactions"}
                onChange={() => setPortfolioMode("transactions")}
                className="accent-[var(--wm-accent)]"
              />
              With Transactions
            </label>
            <p className="mt-3 rounded-lg bg-blue-950/30 px-4 py-2 text-xs text-blue-100">
              Note: You can add strategies later for backtesting. Simulated transactions do not change saved weights
              until you edit the portfolio.
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--wm-text-muted)]">Name</p>
              <p className="text-white">{portfolioName}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--wm-text-muted)]">Currency</p>
              <p className="text-white">{currency}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--wm-text-muted)]">Initial value</p>
              <p className="text-white">${initialInvestment.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--wm-text-muted)]">Method</p>
              <p className="text-white">{summaryMethod}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--wm-text-muted)]">Assets</p>
              <p className="text-white">{summaryAssetCount + (cashPct > 0 ? 1 : 0)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--wm-text-muted)]">Description</p>
              <p className="line-clamp-2 text-white">{description || "—"}</p>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-4">
            <button type="button" className={BTN_GHOST} onClick={() => setStep(3)}>
              ← Previous
            </button>
            <button type="button" className={BTN_PRIMARY} disabled={creating} onClick={submitCreate}>
              {creating ? "Creating…" : "Create Portfolio"}
            </button>
          </div>
        </div>
      )}

      {step === 5 && created && (
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="mb-2 text-xl font-medium text-white">Step 5: Portfolio created</h2>
          <p className="mb-4 text-sm text-[var(--wm-text-muted)]">Portfolio created successfully!</p>
          <div className="mb-4 h-2 w-full rounded-full bg-blue-500/80" />

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-[var(--wm-text-muted)]">Total assets</p>
              <p className="text-lg text-white">{created.assets?.length ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--wm-text-muted)]">Total value</p>
              <p className="text-lg text-white">${initialInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--wm-text-muted)]">Created</p>
              <p className="text-lg text-white">{created.last_updated?.split(" ")[1] ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--wm-text-muted)]">Currency</p>
              <p className="text-lg text-white">{currency}</p>
            </div>
          </div>

          <h3 className="mb-2 text-sm font-medium text-[var(--wm-text-muted)]">Asset allocation</h3>
          <div className="max-h-80 overflow-auto rounded-lg border border-[var(--wm-border)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[var(--wm-text-muted)]">
                  <th className="p-2">Ticker</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Weight</th>
                  <th className="p-2 hidden sm:table-cell">Shares</th>
                  <th className="p-2 hidden sm:table-cell">Price</th>
                  <th className="p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {created.assets.map((a) => {
                  const w = a.weight;
                  const value = initialInvestment * w;
                  const price =
                    a.current_price != null && typeof a.current_price === "number" ? a.current_price : null;
                  const shares = optShares && price && price > 0 ? value / price : null;
                  return (
                    <tr key={a.ticker} className="border-t border-[var(--wm-border)]">
                      <td className="p-2 text-white">{a.ticker}</td>
                      <td className="p-2 text-[var(--wm-text-muted)]">{a.name ?? "—"}</td>
                      <td className="p-2">{(w * 100).toFixed(1)}%</td>
                      <td className="p-2 hidden sm:table-cell">
                        {shares != null ? shares.toFixed(2) : a.ticker === "CASH" ? (initialInvestment * w).toFixed(2) : "—"}
                      </td>
                      <td className="p-2 hidden sm:table-cell">
                        {a.ticker === "CASH" ? "$1.00" : price != null ? `$${price.toFixed(2)}` : "—"}
                      </td>
                      <td className="p-2">${value.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 className="mb-4 mt-8 text-sm font-medium text-[var(--wm-text-muted)]">What&apos;s next?</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {createdStem ? (
              <Link href={`/analysis?p=${encodeURIComponent(createdStem)}`} className={`${BTN_PRIMARY} block text-center`}>
                Analyze Portfolio
              </Link>
            ) : (
              <Link href="/analysis" className={`${BTN_PRIMARY} block text-center`}>
                Analyze Portfolio
              </Link>
            )}
            <button type="button" className={BTN_PRIMARY} onClick={resetAll}>
              Create Another
            </button>
            <Link href="/" className={`${BTN_PRIMARY} block text-center`}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
