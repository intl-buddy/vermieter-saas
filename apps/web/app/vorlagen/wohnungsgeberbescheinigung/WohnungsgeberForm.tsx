"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { WOHNUNGSGEBER_HINWEIS } from "@/lib/pdf/wohnungsgeberLetter";
import type {
  VorlagenProperty,
  VorlagenSender,
} from "@/lib/vorlagen/loadEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EntitySelector } from "../EntitySelector";
import { downloadPdf, todayIso } from "../downloadPdf";

export function WohnungsgeberForm({
  properties,
  sender,
}: {
  properties: VorlagenProperty[];
  sender: VorlagenSender;
}) {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [issuedAt, setIssuedAt] = useState(todayIso());
  const [einzugsdatum, setEinzugsdatum] = useState("");
  const [meldepflichtige, setMeldepflichtige] = useState("");
  const [pending, setPending] = useState(false);

  const property = properties.find((p) => p.id === propertyId) ?? null;
  const unit = property?.units.find((u) => u.id === unitId) ?? null;
  const tenant = unit?.tenants.find((t) => t.id === tenantId) ?? null;

  // Bei Mieterwechsel: Einzugsdatum und meldepflichtige Person vorbefüllen.
  useEffect(() => {
    if (tenant) {
      setEinzugsdatum(tenant.move_in_date);
      setMeldepflichtige(
        [tenant.first_name, tenant.last_name].filter(Boolean).join(" ").trim(),
      );
    }
  }, [tenant]);

  const wohnungAnschrift = property
    ? `${property.street} ${property.house_number}, ${property.zip} ${property.city}`.trim()
    : "";
  const einheit = unit
    ? [unit.label, unit.floor].filter(Boolean).join(", ")
    : "";

  const recipient = useMemo(() => {
    if (!property || !unit || !tenant) return null;
    return {
      name: [tenant.first_name, tenant.last_name].filter(Boolean).join(" ").trim(),
      street: `${property.street} ${property.house_number}`.trim(),
      zipCity: `${property.zip} ${property.city}`.trim(),
    };
  }, [property, unit, tenant]);

  async function onGenerate() {
    if (!recipient || !tenant) {
      toast.error("Bitte Objekt, Einheit und Mieter auswählen.");
      return;
    }
    if (!einzugsdatum) {
      toast.error("Bitte das Einzugsdatum angeben.");
      return;
    }
    setPending(true);
    try {
      await downloadPdf("/api/vorlagen/wohnungsgeber", {
        recipient,
        issuedAt,
        wohnungAnschrift,
        einheit,
        einzugsdatum,
        meldepflichtige,
        filenamePart: tenant.last_name,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Erzeugen.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-6">
          <EntitySelector
            properties={properties}
            propertyId={propertyId}
            unitId={unitId}
            tenantId={tenantId}
            onChange={(next) => {
              setPropertyId(next.propertyId);
              setUnitId(next.unitId);
              setTenantId(next.tenantId);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="issuedAt">Ausstellungsdatum</Label>
              <Input
                id="issuedAt"
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="einzug">Datum des Einzugs</Label>
              <Input
                id="einzug"
                type="date"
                value={einzugsdatum}
                onChange={(e) => setEinzugsdatum(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="melde">Meldepflichtige Person(en)</Label>
            <Textarea
              id="melde"
              rows={3}
              value={meldepflichtige}
              onChange={(e) => setMeldepflichtige(e.target.value)}
              placeholder="Eine Person pro Zeile"
            />
            <p className="text-xs text-muted-foreground">
              Eine Person pro Zeile – z. B. weitere einziehende Personen ergänzen.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vorschau */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Vorschau</h2>
        <Card>
          <CardContent className="flex flex-col gap-3 p-6 text-sm leading-relaxed">
            <p className="font-bold">
              Wohnungsgeberbestätigung gemäß § 19 Bundesmeldegesetz (BMG)
            </p>
            <p>
              Hiermit wird gemäß § 19 Abs. 1 Bundesmeldegesetz (BMG) der/den
              nachstehend genannten meldepflichtigen Person(en) bestätigt, dass
              diese in die nachfolgend bezeichnete Wohnung eingezogen ist/sind:
            </p>
            <dl className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
              <Row label="Wohnungsgeber" value={sender.fullName || "[Profil]"} />
              <Row label="Anschrift der Wohnung" value={wohnungAnschrift || "–"} />
              <Row label="Wohnung / Einheit" value={einheit || "–"} />
              <Row
                label="Datum des Einzugs"
                value={einzugsdatum ? formatDate(einzugsdatum) : "–"}
              />
              <Row
                label="Meldepflichtige Person(en)"
                value={meldepflichtige || "–"}
              />
            </dl>
            <p className="text-xs text-muted-foreground">
              {WOHNUNGSGEBER_HINWEIS}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <Button onClick={onGenerate} disabled={pending || !recipient}>
          {pending ? "PDF wird erzeugt …" : "PDF erzeugen"}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 px-3 py-2">
      <dt className="w-2/5 font-medium text-muted-foreground">{label}</dt>
      <dd className="w-3/5 whitespace-pre-line">{value}</dd>
    </div>
  );
}
