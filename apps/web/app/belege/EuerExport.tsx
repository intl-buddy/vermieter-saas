"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const SELECT_CLS =
  "h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EuerExport({
  currentYear,
  missingCount,
}: {
  currentYear: number;
  missingCount: number;
}) {
  const [year, setYear] = useState(currentYear);
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <select
          aria-label="Jahr für EÜR-Export"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className={SELECT_CLS}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <Button asChild variant="outline">
          <a href={`/belege/euer?jahr=${year}`}>
            <Download className="size-4" />
            EÜR-Export (CSV)
          </a>
        </Button>
      </div>
      <p className="max-w-xs text-xs text-muted-foreground">
        Enthält alle Belege mit Zahlungsdatum im gewählten Jahr (Zufluss-/
        Abflussprinzip).
      </p>
      {missingCount > 0 ? (
        <p className="max-w-xs text-xs font-medium text-warning-700">
          {missingCount}{" "}
          {missingCount === 1 ? "Beleg" : "Belege"} ohne Zahlungsdatum – nicht im
          Export enthalten.
        </p>
      ) : null}
    </div>
  );
}
