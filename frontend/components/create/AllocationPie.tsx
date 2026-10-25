"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#bf9ffb",
  "#90bff9",
  "#74f174",
  "#f59e0b",
  "#faa1a4",
  "#a78bfa",
  "#38bdf8",
  "#f472b6",
  "#34d399",
  "#fcd34d",
];

type Slice = { name: string; value: number };

export function AllocationPie({
  data,
  title = "Asset allocation",
}: {
  data: Slice[];
  title?: string;
}) {
  if (!data.length) return null;
  return (
    <div className="mt-6">
      <p className="mb-2 text-center text-sm text-[var(--wm-text-muted)]">{title}</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={88}
              paddingAngle={1}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => `${(Number(v) * 100).toFixed(2)}%`}
              contentStyle={{
                background: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
