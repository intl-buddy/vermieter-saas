"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createProtocolDraft } from "./actions";
import { TYPE_LABELS, type HandoverType } from "./types";

const SELECT_CLS =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type UnitOption = {
  id: string;
  label: string;
  propertyId: string;
  activeTenantId: string | null;
};
export type PropertyOption = { id: string; name: string };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "Wird gestartet …" : "Protokoll starten"}
    </Button>
  );
}

export function StartProtocolForm({
  properties,
  units,
}: {
  properties: PropertyOption[];
  units: UnitOption[];
}) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const unitsForProperty = useMemo(
    () => units.filter((u) => u.propertyId === propertyId),
    [units, propertyId],
  );
  const [unitId, setUnitId] = useState(unitsForProperty[0]?.id ?? "");
  const [type, setType] = useState<HandoverType>("move_out");

  // Bei Objektwechsel die Einheit zurücksetzen.
  function onPropertyChange(id: string) {
    setPropertyId(id);
    const first = units.find((u) => u.propertyId === id);
    setUnitId(first?.id ?? "");
  }

  const selectedUnit = units.find((u) => u.id === unitId);
  const activeTenantId = selectedUnit?.activeTenantId ?? "";

  return (
    <form action={createProtocolDraft} className="flex flex-col gap-4">
      <input type="hidden" name="tenant_id" value={activeTenantId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="start-property">Objekt</Label>
        <select
          id="start-property"
          className={SELECT_CLS}
          value={propertyId}
          onChange={(e) => onPropertyChange(e.target.value)}
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="start-unit">Einheit</Label>
        <select
          id="start-unit"
          name="unit_id"
          className={SELECT_CLS}
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
        >
          {unitsForProperty.length === 0 ? (
            <option value="">Keine Einheiten</option>
          ) : (
            unitsForProperty.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="start-type">Art der Übergabe</Label>
        <select
          id="start-type"
          name="type"
          className={SELECT_CLS}
          value={type}
          onChange={(e) => setType(e.target.value as HandoverType)}
        >
          <option value="move_out">{TYPE_LABELS.move_out}</option>
          <option value="move_in">{TYPE_LABELS.move_in}</option>
        </select>
      </div>

      <div>
        <SubmitButton disabled={!unitId} />
      </div>
    </form>
  );
}
