"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const EUR = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const EUR2 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

// Grün-Töne (umlagefähig) und Grau-Töne (nicht umlagefähig), aus den Tokens.
const GREENS = ["#237f3d", "#2a9549", "#47ac6a", "#72c08f", "#a6d8b7", "#cfead9"];
const GREYS = ["#4e565b", "#6b747a", "#9aa2a8", "#cbd0d3"];

export type CostSlice = {
  label: string;
  sum: number;
  apportionable: boolean;
};

type SliceWithColor = CostSlice & { fill: string };

function assignColors(slices: CostSlice[]): SliceWithColor[] {
  let g = 0;
  let n = 0;
  return slices.map((s) => ({
    ...s,
    fill: s.apportionable
      ? GREENS[g++ % GREENS.length]!
      : GREYS[n++ % GREYS.length]!,
  }));
}

function DonutTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { payload: SliceWithColor }[];
  total: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const s = payload[0]!.payload;
  const share = total > 0 ? Math.round((s.sum / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-md">
      <div className="font-semibold">{s.label}</div>
      <div className="text-muted-foreground">
        {EUR2.format(s.sum)} · {share} %
      </div>
      <div className="text-xs text-muted-foreground">
        {s.apportionable ? "umlagefähig" : "nicht umlagefähig"}
      </div>
    </div>
  );
}

export function CostDonut({
  slices,
  total,
}: {
  slices: CostSlice[];
  total: number;
}) {
  const data = assignColors(slices);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="sum"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={1}
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((s) => (
                <Cell key={s.label} fill={s.fill} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Gesamt</span>
          <span className="text-lg font-bold tabular-nums text-foreground">
            {EUR.format(total)}
          </span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-1.5">
        {data.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: s.fill }}
              aria-hidden
            />
            <span className="flex-1 truncate">{s.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {EUR2.format(s.sum)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
