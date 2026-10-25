"use client";

import { useEffect, useState } from "react";
import { apiPostMultipart, type PortfolioFull } from "@/lib/api";
import { HelpTooltip, LabelWithHelp } from "./HelpTooltip";
import { WizardCsvFormatHelp } from "./WizardHelpPanels";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

type Preview = {
  columns: string[];
  has_ticker_column: boolean;
  preview: Record<string, unknown>[];
};

export function CsvImportPanel({
  flashOk,
  flashErr,
  defaultPortfolioName = "",
  onImported,
}: {
  flashOk: (m: string) => void;
  flashErr: (m: string) => void;
  defaultPortfolioName?: string;
  onImported?: (portfolio: PortfolioFull) => void;
}) {
  const [name, setName] = useState(defaultPortfolioName);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    setName(defaultPortfolioName);
  }, [defaultPortfolioName]);

  const onFile = async (f: File | null) => {
    setFile(f);
    setPreview(null);
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    try {
      const p = await apiPostMultipart<Preview>("/portfolios/preview-csv", fd);
      setPreview(p);
    } catch (e) {
      flashErr(errMsg(e));
    }
  };

  const importCsv = async () => {
    if (!name.trim() || !file) {
      flashErr("Name and CSV file required.");
      return;
    }
    const fd = new FormData();
    fd.append("portfolio_name", name.trim());
    fd.append("file", file);
    try {
      const res = await apiPostMultipart<{ portfolio: PortfolioFull }>("/portfolios/import-csv", fd);
      flashOk(`Imported "${name.trim()}".`);
      setFile(null);
      setPreview(null);
      if (res.portfolio) onImported?.(res.portfolio);
    } catch (e) {
      flashErr(errMsg(e));
    }
  };

  return (
    <div>
      <details className="mb-4 rounded-lg border border-[var(--wm-border)] bg-black/20 px-3 py-2 text-sm" open>
        <summary className="cursor-pointer text-[var(--wm-text-muted)]">What file format do I need?</summary>
        <WizardCsvFormatHelp />
      </details>
      <LabelWithHelp
        label="Portfolio name"
        hint="Name for the new portfolio after import. Should match what you want in the list (can match wizard name)."
        className="mb-4"
      >
        <input
          className="mt-1 w-full rounded-lg border border-[var(--wm-border)] bg-black/40 px-3 py-2 text-white"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </LabelWithHelp>
      <div className="mb-4">
        <span className="mb-2 inline-flex items-center text-sm text-[var(--wm-text-muted)]">
          Choose file
          <HelpTooltip text="Upload a .csv file with a ticker column. Optional weight column; invalid symbols are dropped on save." />
        </span>
        <input
          type="file"
          accept=".csv"
          className="mt-1 block w-full text-sm text-[var(--wm-text-muted)] file:mr-3 file:rounded-lg file:border file:border-[var(--wm-border)] file:bg-black/40 file:px-3 file:py-2 file:text-white"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {preview && (
        <div className="mb-4">
          {!preview.has_ticker_column && (
            <p className="mb-2 text-[var(--wm-red)]">CSV must include a &quot;ticker&quot; column.</p>
          )}
          <p className="text-sm text-[var(--wm-text-muted)]">Columns: {preview.columns.join(", ")}</p>
          <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-[var(--wm-border)]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-black/40 text-[var(--wm-text-muted)]">
                  {preview.columns.map((c) => (
                    <th key={c} className="p-2">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row, i) => (
                  <tr key={i} className="border-t border-[var(--wm-border)]">
                    {preview.columns.map((c) => (
                      <td key={c} className="p-2 text-white">
                        {String(row[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={importCsv}
        disabled={!preview?.has_ticker_column}
        className="rounded-lg border border-[var(--wm-accent)] px-4 py-2 text-sm text-[var(--wm-accent)] disabled:opacity-40"
      >
        Import portfolio
      </button>
    </div>
  );
}
