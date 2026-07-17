import type { CityStats } from "@repo/core";

/**
 * „Einheiten je Stadt" (Top 10) – einreihiges Magnituden-Balkendiagramm.
 * Eine Akzentfarbe (Marken-Grün), direkte Wertbeschriftung, zurückhaltende
 * Achse. Die vollständige, sortierbare Tabelle darüber ist die Datenansicht;
 * die Werte stehen zusätzlich am Balken, sodass die Aussage nicht allein an der
 * Farbe hängt.
 */
export function UnitsByCityChart({ rows }: { rows: CityStats[] }) {
  const top = [...rows].sort((a, b) => b.units - a.units).slice(0, 10);
  const max = Math.max(1, ...top.map((r) => r.units));

  if (top.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Noch keine Daten.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2" role="img" aria-label="Einheiten je Stadt, Top 10">
      {top.map((row) => {
        const pct = Math.max(2, Math.round((row.units / max) * 100));
        return (
          <div key={row.city} className="flex items-center gap-3">
            <div
              className="w-28 shrink-0 truncate text-right text-sm text-neutral-600"
              title={row.city}
            >
              {row.city}
            </div>
            <div className="flex flex-1 items-center gap-2">
              <div
                className="h-5 rounded-r bg-primary"
                style={{ width: `${pct}%` }}
                title={`${row.city}: ${row.units} Einheiten`}
              />
              <span className="text-sm font-medium tabular-nums text-neutral-700">
                {row.units}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
