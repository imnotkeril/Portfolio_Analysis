"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export function HealthBadge() {
  const [s, setS] = useState<"loading" | "ok" | "down">("loading");

  useEffect(() => {
    apiGet<{ status: string }>("/health")
      .then(() => setS("ok"))
      .catch(() => setS("down"));
  }, []);

  const label =
    s === "loading"
      ? "Checking…"
      : s === "ok"
        ? "Backend reachable"
        : "Backend offline — start API (port 8000)";

  return (
    <div className="glass-panel rounded-xl px-4 py-3 text-left text-sm">
      <p className="text-[var(--wm-text-muted)]">API status</p>
      <p className="mt-1 flex items-center gap-2 font-medium">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            s === "ok" ? "bg-[var(--wm-green)]" : s === "down" ? "bg-[var(--wm-red)]" : "bg-[var(--wm-text-dim)]"
          }`}
        />
        {label}
      </p>
    </div>
  );
}
