import type { WeeklyRegistration } from "@repo/core";

/** Kompaktes „dd.mm." aus einem ISO-Datum (YYYY-MM-DD). */
function shortDate(iso: string): string {
  if (iso.length < 10) return iso;
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;
}

/**
 * Registrierungen je Woche (letzte 12 Wochen) – einreihiges vertikales
 * Balkendiagramm, eine Akzentfarbe, Werte direkt über den Balken.
 */
export function WeeklyRegistrationsChart({
  data,
}: {
  data: WeeklyRegistration[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Daten.</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div
      className="flex h-40 items-end gap-1.5"
      role="img"
      aria-label="Registrierungen je Woche, letzte 12 Wochen"
    >
      {data.map((d) => {
        const pct = d.count === 0 ? 0 : Math.max(4, (d.count / max) * 100);
        return (
          <div
            key={d.weekStart}
            className="flex flex-1 flex-col items-center justify-end gap-1"
            title={`Woche ab ${shortDate(d.weekStart)}: ${d.count}`}
          >
            <span className="text-xs font-medium tabular-nums text-neutral-600">
              {d.count}
            </span>
            <div
              className="w-full rounded-t bg-primary"
              style={{ height: `${pct}%` }}
            />
            <span className="text-[10px] text-neutral-400">
              {shortDate(d.weekStart)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
