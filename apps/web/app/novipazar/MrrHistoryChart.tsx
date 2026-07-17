import type { MetricsPoint } from "@repo/core";

const NF = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function shortDate(iso: string): string {
  if (iso.length < 10) return iso;
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;
}

/**
 * MRR-Verlauf aus den Tages-Snapshots – schlichtes SVG-Liniendiagramm (eine
 * Serie, eine Akzentfarbe, leichte Flächenfüllung). Der Verlauf füllt sich ab
 * dem ersten Snapshot Tag für Tag; bei nur einem Punkt zeigen wir den Wert an.
 */
export function MrrHistoryChart({ data }: { data: MetricsPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch kein Verlauf – der erste Snapshot entsteht heute, danach kommt
        täglich ein Punkt hinzu.
      </p>
    );
  }

  const latest = data[data.length - 1]!;

  if (data.length === 1) {
    return (
      <div>
        <div className="text-3xl font-bold text-foreground">
          {NF.format(latest.mrrGross)}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Stand {shortDate(latest.snapshotDate)}. Der Verlauf füllt sich ab jetzt
          täglich.
        </p>
      </div>
    );
  }

  const W = 640;
  const H = 180;
  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 20;
  const max = Math.max(1, ...data.map((d) => d.mrrGross));
  const n = data.length;

  const x = (i: number) => padL + (i * (W - padL - padR)) / (n - 1);
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB);

  const line = data.map((d, i) => `${x(i)},${y(d.mrrGross)}`).join(" ");
  const area = `${padL},${H - padB} ${line} ${x(n - 1)},${H - padB}`;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`MRR-Verlauf, aktuell ${NF.format(latest.mrrGross)}`}
      >
        {/* Grundlinie */}
        <line
          x1={padL}
          y1={H - padB}
          x2={W - padR}
          y2={H - padB}
          className="stroke-neutral-200"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <polygon points={area} className="fill-primary/10" />
        <polyline
          points={line}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{shortDate(data[0]!.snapshotDate)}</span>
        <span className="font-medium text-neutral-700">
          aktuell {NF.format(latest.mrrGross)}
        </span>
        <span>{shortDate(latest.snapshotDate)}</span>
      </figcaption>
    </figure>
  );
}
