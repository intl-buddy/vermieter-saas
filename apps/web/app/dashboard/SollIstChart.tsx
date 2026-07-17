"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { MonthPoint } from "@repo/core";

const SOLL = "#cfead9"; // primary-100 (heller Ziel-Balken)
const IST = "#2a9549"; // primary-500
const DANGER = "#dc2626"; // danger-600

const EUR = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const EUR2 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

type Row = MonthPoint & { marker: number | null };

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]!.payload;
  const diff = p.ist - p.soll;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-md">
      <div className="mb-1 font-semibold">
        {p.label} {p.year}
      </div>
      <div className="flex justify-between gap-6">
        <span className="text-muted-foreground">Soll</span>
        <span className="tabular-nums">{EUR2.format(p.soll)}</span>
      </div>
      <div className="flex justify-between gap-6">
        <span className="text-muted-foreground">Ist</span>
        <span className="tabular-nums">{EUR2.format(p.ist)}</span>
      </div>
      <div className="mt-1 flex justify-between gap-6 border-t border-neutral-100 pt-1">
        <span className="text-muted-foreground">Differenz</span>
        <span
          className="font-semibold tabular-nums"
          style={{ color: diff < 0 ? DANGER : IST }}
        >
          {diff >= 0 ? "+" : ""}
          {EUR2.format(diff)}
        </span>
      </div>
    </div>
  );
}

export function SollIstChart({ series }: { series: MonthPoint[] }) {
  const data: Row[] = series.map((p) => ({
    ...p,
    marker: p.shortfall ? Math.max(p.soll, p.ist) : null,
  }));

  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label="Mieteinnahmen Soll gegen Ist, letzte 12 Monate"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#eef0f1" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "#e2e5e7" }}
            tick={{ fontSize: 11, fill: "#6b747a" }}
          />
          <YAxis
            width={44}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#9aa2a8" }}
            tickFormatter={(v: number) => EUR.format(v)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f7f8f8" }} />
          <Legend
            formatter={(value) => (value === "soll" ? "Soll" : "Ist")}
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="soll" name="soll" fill={SOLL} radius={[4, 4, 0, 0]} />
          <Bar dataKey="ist" name="ist" fill={IST} radius={[4, 4, 0, 0]} />
          <Line
            dataKey="marker"
            legendType="none"
            stroke="transparent"
            isAnimationActive={false}
            connectNulls={false}
            dot={{ r: 4, fill: DANGER, stroke: "#ffffff", strokeWidth: 1 }}
            activeDot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
