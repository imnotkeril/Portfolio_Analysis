"use client";

import type { ReactNode } from "react";

/**
 * Streamlit-style (?): native title tooltip on hover (same idea as st.text_input(..., help="...")).
 */
export function HelpTooltip({ text }: { text: string }) {
  return (
    <span
      className="ml-1 inline-flex h-[18px] min-w-[18px] cursor-help items-center justify-center rounded-full border border-white/35 px-0.5 text-[10px] font-semibold leading-none text-white/75 hover:border-[var(--wm-accent)] hover:text-[var(--wm-accent)]"
      title={text}
      role="img"
      aria-label={text}
    >
      ?
    </span>
  );
}

export function LabelWithHelp({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm text-[var(--wm-text-muted)] ${className}`}>
      <span className="inline-flex items-center">
        {label}
        <HelpTooltip text={hint} />
      </span>
      {children}
    </label>
  );
}
