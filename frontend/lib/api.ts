/** Browser: same-origin proxy (Docker-friendly; avoids wrong NEXT_PUBLIC hitting :3000). */
const PROXY_PREFIX = "/api/proxy";

function apiOrigin(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    (typeof process !== "undefined" && process.env.API_URL) ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");
}

function buildApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return `${PROXY_PREFIX}${p}`;
  }
  return `${apiOrigin()}${p}`;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(buildApiUrl(path), { cache: "no-store" });
  return handle<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(buildApiUrl(path), { method: "DELETE" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
}

export type PortfolioSummary = {
  name: string;
  filename: string;
  last_updated: string;
  asset_count: number;
  description?: string;
};

export type PortfolioFull = {
  name: string;
  description?: string;
  assets: Array<{
    ticker: string;
    weight: number;
    name?: string;
    sector?: string;
    current_price?: number | null;
  }>;
  last_updated?: string;
};

export type AnalysisResult = {
  valid_tickers: string[];
  missing_tickers: string[];
  metrics: Record<string, number | null>;
  timeseries: Array<{
    date: string;
    portfolio_pct: number;
    benchmark_pct: number | null;
  }>;
};

export function portfolioFileStem(filename: string): string {
  return filename.replace(/\.json$/i, "");
}

export type TemplateSummary = {
  id: string;
  title: string;
  description: string;
  asset_count: number;
};

export type TemplateDetail = {
  title: string;
  description: string;
  tags?: string[];
  assets: Array<{
    ticker: string;
    weight: number;
    name?: string;
    sector?: string;
    asset_class?: string;
  }>;
};

export async function apiPostMultipart<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(buildApiUrl(path), { method: "POST", body: form });
  return handle<T>(res);
}

export async function downloadPortfolioCsv(stem: string, downloadName: string): Promise<void> {
  const res = await fetch(
    buildApiUrl(`/portfolios/${encodeURIComponent(stem)}/export-csv`),
    { cache: "no-store" }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadName.endsWith(".csv") ? downloadName : `${downloadName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
