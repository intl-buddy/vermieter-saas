"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";

export type PropertyOption = { id: string; name: string };
export type UnitOption = {
  id: string;
  label: string;
  property_id: string;
  propertyName: string | null;
};

const SELECT_CLS =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

/**
 * Zwei optionale Auswahlfelder (Objekt / Einheit). Native `<select>`, damit eine
 * leere Auswahl („keins") sauber als leerer Wert übermittelt wird.
 */
export function ScopeFields({
  properties,
  units,
  defaultPropertyId,
  defaultUnitId,
}: {
  properties: PropertyOption[];
  units: UnitOption[];
  defaultPropertyId?: string | null;
  defaultUnitId?: string | null;
}) {
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? "");
  const visibleUnits = propertyId
    ? units.filter((u) => u.property_id === propertyId)
    : units;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="property_id">Objekt (optional)</Label>
        <select
          id="property_id"
          name="property_id"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">— Kein Objekt —</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="unit_id">Einheit (optional)</Label>
        <select
          id="unit_id"
          name="unit_id"
          defaultValue={defaultUnitId ?? ""}
          className={SELECT_CLS}
        >
          <option value="">— Keine Einheit —</option>
          {visibleUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {u.propertyName ? `${u.propertyName} · ` : ""}
              {u.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
