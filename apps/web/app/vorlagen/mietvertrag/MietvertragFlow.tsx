"use client";

import { useState } from "react";
import { Building2, Home, Store } from "lucide-react";
import type {
  VorlagenProperty,
  VorlagenSender,
} from "@/lib/vorlagen/loadEntities";
import { Card, CardContent } from "@/components/ui/card";
import { MietvertragForm } from "./MietvertragForm";
import { GewerbemietvertragForm } from "./GewerbemietvertragForm";

type Vertragstyp = "wohnraum" | "gewerbe";

/** unit_type → empfohlener Vertragstyp. */
function suggestedTypeFor(unitType: string | null): Vertragstyp | null {
  if (!unitType) return null;
  return unitType === "commercial" ? "gewerbe" : "wohnraum";
}

/**
 * Einstieg in den Mietvertrag-Flow: Auswahl Wohnraum-/Gewerbemietvertrag.
 * Wählt der Nutzer eine Einheit, deren unit_type nicht zum gewählten
 * Vertragstyp passt, erscheint eine Empfehlung zum Wechsel.
 */
export function MietvertragFlow({
  properties,
  sender,
}: {
  properties: VorlagenProperty[];
  sender: VorlagenSender;
}) {
  const [type, setType] = useState<Vertragstyp>("wohnraum");
  const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null);

  const suggested = suggestedTypeFor(selectedUnitType);
  const mismatch = suggested !== null && suggested !== type;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          <h2 className="text-base font-semibold">Vertragstyp</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 hover:bg-neutral-50 has-[:checked]:border-primary has-[:checked]:bg-primary-50"
            >
              <input
                type="radio"
                name="vertragstyp"
                className="mt-1 accent-primary"
                checked={type === "wohnraum"}
                onChange={() => setType("wohnraum")}
              />
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <Home className="size-4" />
                  Wohnraummietvertrag
                </span>
                <span className="text-sm text-muted-foreground">
                  Für Wohnungen und Wohnräume.
                </span>
              </span>
            </label>
            <label
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-4 hover:bg-neutral-50 has-[:checked]:border-primary has-[:checked]:bg-primary-50"
            >
              <input
                type="radio"
                name="vertragstyp"
                className="mt-1 accent-primary"
                checked={type === "gewerbe"}
                onChange={() => setType("gewerbe")}
              />
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 font-medium">
                  <Store className="size-4" />
                  Gewerbemietvertrag (Geschäftsräume)
                </span>
                <span className="text-sm text-muted-foreground">
                  Für Läden, Büros und sonstige Gewerbeeinheiten.
                </span>
              </span>
            </label>
          </div>

          {mismatch ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2.5 text-sm text-gold-900">
              <span className="flex items-center gap-2">
                <Building2 className="size-4 shrink-0" />
                {suggested === "gewerbe"
                  ? "Diese Einheit ist als Gewerbe angelegt – Gewerbemietvertrag empfohlen."
                  : "Diese Einheit ist als Wohnraum angelegt – Wohnraummietvertrag empfohlen."}
              </span>
              <button
                type="button"
                onClick={() => setType(suggested)}
                className="shrink-0 rounded-md bg-gold-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gold-700"
              >
                {suggested === "gewerbe"
                  ? "Zum Gewerbemietvertrag"
                  : "Zum Wohnraummietvertrag"}
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {type === "wohnraum" ? (
        <MietvertragForm
          properties={properties}
          sender={sender}
          onSelectedUnitType={setSelectedUnitType}
        />
      ) : (
        <GewerbemietvertragForm
          properties={properties}
          sender={sender}
          onSelectedUnitType={setSelectedUnitType}
        />
      )}
    </div>
  );
}
