"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { CityStats } from "@repo/core";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SortKey = "city" | "properties" | "units" | "activeTenancies" | "avgRentPerSqm";

const NF = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "city", label: "Stadt", numeric: false },
  { key: "properties", label: "Objekte", numeric: true },
  { key: "units", label: "Einheiten", numeric: true },
  { key: "activeTenancies", label: "Aktive Mietverh.", numeric: true },
  { key: "avgRentPerSqm", label: "Ø Kaltmiete €/m²", numeric: true },
];

export function CityTable({ rows }: { rows: CityStats[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("units");
  const [asc, setAsc] = useState(false);

  function toggle(key: SortKey) {
    if (key === sortKey) {
      setAsc((a) => !a);
    } else {
      setSortKey(key);
      setAsc(key === "city"); // Text aufsteigend, Zahlen absteigend als Default
    }
  }

  const sorted = [...rows].sort((a, b) => {
    let cmp: number;
    if (sortKey === "city") {
      cmp = a.city.localeCompare(b.city, "de");
    } else {
      // null (keine Ø-Miete) ans Ende sortieren
      const av = a[sortKey];
      const bv = b[sortKey];
      const an = av == null ? -Infinity : av;
      const bn = bv == null ? -Infinity : bv;
      cmp = an - bn;
    }
    return asc ? cmp : -cmp;
  });

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Noch keine Objekte erfasst.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                className={cn(col.numeric && "text-right")}
              >
                <button
                  type="button"
                  onClick={() => toggle(col.key)}
                  className={cn(
                    "inline-flex items-center gap-1 font-semibold hover:text-foreground",
                    col.numeric && "flex-row-reverse",
                    sortKey === col.key ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {col.label}
                  {sortKey === col.key ? (
                    asc ? (
                      <ArrowUp className="size-3.5" />
                    ) : (
                      <ArrowDown className="size-3.5" />
                    )
                  ) : null}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => (
            <TableRow key={row.city}>
              <TableCell className="font-medium">{row.city}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.properties}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.units}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.activeTenancies}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.avgRentPerSqm == null
                  ? "–"
                  : `${NF.format(row.avgRentPerSqm)} €`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
