"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const SELECT_CLS =
  "h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function EuerExport({ currentYear }: { currentYear: number }) {
  const [year, setYear] = useState(currentYear);
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
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
  );
}
