import { PORTFOLIO_BUCKETS, type PortfolioRow } from "@repo/core";

/**
 * Verteilung der Nutzer nach Einheitenzahl – horizontales Histogramm mit
 * Paketgrenzen als Kontext (0, 1–3 Bronze, 4–5 Silber, …).
 */
export function PortfolioHistogram({ rows }: { rows: PortfolioRow[] }) {
  const countByBucket = new Map(rows.map((r) => [r.bucket, r.count]));
  const ordered = PORTFOLIO_BUCKETS.map((b) => ({
    ...b,
    count: countByBucket.get(b.bucket) ?? 0,
  }));
  const max = Math.max(1, ...ordered.map((b) => b.count));

  return (
    <div
      className="flex flex-col gap-2"
      role="img"
      aria-label="Nutzer nach Einheitenzahl"
    >
      {ordered.map((b) => {
        const pct = b.count === 0 ? 0 : Math.max(2, (b.count / max) * 100);
        return (
          <div key={b.bucket} className="flex items-center gap-3">
            <div className="w-32 shrink-0 text-right text-sm text-neutral-600">
              {b.bucket}
              <span className="ml-1 text-xs text-neutral-400">({b.plan})</span>
            </div>
            <div className="flex flex-1 items-center gap-2">
              <div
                className="h-5 rounded-r bg-secondary"
                style={{ width: `${pct}%` }}
                title={`${b.bucket} Einheiten: ${b.count} Nutzer`}
              />
              <span className="text-sm font-medium tabular-nums text-neutral-700">
                {b.count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
