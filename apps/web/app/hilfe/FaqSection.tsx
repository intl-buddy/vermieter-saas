"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FAQS } from "./faqs";

/** Durchsuchbares FAQ-Accordion (einfacher Textfilter über Frage + Antwort). */
export function FaqSection() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) =>
        f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div>
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Frage suchen …"
          className="pl-9"
          aria-label="FAQ durchsuchen"
        />
      </div>

      {results.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-muted-foreground">
          Keine passende Frage gefunden. Schreib uns unten einfach dein
          Anliegen.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-neutral-200 bg-white px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-secondary marker:hidden">
                {item.q}
                <span
                  className="shrink-0 text-neutral-400 transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
