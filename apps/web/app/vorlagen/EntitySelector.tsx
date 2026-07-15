"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  VorlagenProperty,
  VorlagenTenant,
  VorlagenUnit,
} from "@/lib/vorlagen/loadEntities";

export type EntitySelection = {
  property: VorlagenProperty;
  unit: VorlagenUnit;
  tenant: VorlagenTenant;
};

export function EntitySelector({
  properties,
  propertyId,
  unitId,
  tenantId,
  showTenant = true,
  onChange,
}: {
  properties: VorlagenProperty[];
  propertyId: string | null;
  unitId: string | null;
  tenantId: string | null;
  showTenant?: boolean;
  onChange: (next: {
    propertyId: string | null;
    unitId: string | null;
    tenantId: string | null;
  }) => void;
}) {
  const property = useMemo(
    () => properties.find((p) => p.id === propertyId) ?? null,
    [properties, propertyId],
  );
  const units = property?.units ?? [];
  const unit = useMemo(
    () => units.find((u) => u.id === unitId) ?? null,
    [units, unitId],
  );
  const tenants = unit?.tenants ?? [];

  function tenantName(t: VorlagenTenant): string {
    return (
      [t.first_name, t.last_name].filter(Boolean).join(" ").trim() ||
      "Unbenannter Mieter"
    );
  }

  return (
    <div
      className={
        showTenant
          ? "grid grid-cols-1 gap-4 sm:grid-cols-3"
          : "grid grid-cols-1 gap-4 sm:grid-cols-2"
      }
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sel-property">Objekt</Label>
        <Select
          value={propertyId ?? undefined}
          onValueChange={(v) =>
            onChange({ propertyId: v, unitId: null, tenantId: null })
          }
        >
          <SelectTrigger id="sel-property">
            <SelectValue placeholder="Objekt wählen" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sel-unit">Einheit</Label>
        <Select
          value={unitId ?? undefined}
          disabled={!property}
          onValueChange={(v) =>
            onChange({ propertyId, unitId: v, tenantId: null })
          }
        >
          <SelectTrigger id="sel-unit">
            <SelectValue placeholder="Einheit wählen" />
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showTenant ? (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sel-tenant">Mieter</Label>
        <Select
          value={tenantId ?? undefined}
          disabled={!unit || tenants.length === 0}
          onValueChange={(v) => onChange({ propertyId, unitId, tenantId: v })}
        >
          <SelectTrigger id="sel-tenant">
            <SelectValue
              placeholder={
                unit && tenants.length === 0
                  ? "Kein Mieter hinterlegt"
                  : "Mieter wählen"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {tenantName(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      ) : null}
    </div>
  );
}
