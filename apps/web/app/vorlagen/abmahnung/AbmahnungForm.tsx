"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import {
  ABMAHNUNG_GESPRAECH,
  ABMAHNUNG_RECHTSFOLGEN,
  ABMAHNUNG_VARIANTS,
  abmahnungByKey,
  type AbmahnungVariantKey,
} from "@/lib/vorlagen/abmahnung";
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
import { downloadPdf, isoInDays, todayIso } from "../downloadPdf";

export function AbmahnungForm({
  properties,
  sender,
}: {
  properties: VorlagenProperty[];
  sender: VorlagenSender;
}) {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [variantKey, setVariantKey] = useState<AbmahnungVariantKey>("zahlung");
  const [sachverhalt, setSachverhalt] = useState(
    abmahnungByKey("zahlung").sachverhalt,
  );
  const [issuedAt, setIssuedAt] = useState(todayIso());
  const [deadline, setDeadline] = useState(isoInDays(14));
  const [pending, setPending] = useState(false);

  const property = properties.find((p) => p.id === propertyId) ?? null;
  const unit = property?.units.find((u) => u.id === unitId) ?? null;
  const tenant = unit?.tenants.find((t) => t.id === tenantId) ?? null;

  const variant = abmahnungByKey(variantKey);

  const recipient = useMemo(() => {
    if (!property || !unit || !tenant) return null;
    return {
      name: [tenant.first_name, tenant.last_name].filter(Boolean).join(" ").trim(),
      lastName: tenant.last_name,
      street: `${property.street} ${property.house_number}`.trim(),
      zipCity: `${property.zip} ${property.city}`.trim(),
    };
  }, [property, unit, tenant]);

  const objektLabel = property?.name ?? "";
  const einheitLabel = unit?.label ?? "";
  const subject = `Abmahnung wegen ${variant.grund} – ${objektLabel}, ${einheitLabel}`;

  function onVariantChange(key: AbmahnungVariantKey) {
    setVariantKey(key);
    // Sachverhalt auf den variantenspezifischen Standardtext zurücksetzen.
    setSachverhalt(abmahnungByKey(key).sachverhalt);
  }

  async function onGenerate() {
    if (!recipient) {
      toast.error("Bitte Objekt, Einheit und Mieter auswählen.");
      return;
    }
    setPending(true);
    try {
      await downloadPdf("/api/vorlagen/abmahnung", {
        recipient,
        issuedAt,
        deadline,
        grund: variant.grund,
        objektLabel,
        einheitLabel,
        sachverhalt,
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
          <div className="flex flex-col gap-2">
            <Label>Grund der Abmahnung</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ABMAHNUNG_VARIANTS.map((v) => (
                <label
                  key={v.key}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-200 p-3 text-sm hover:bg-neutral-50 has-[:checked]:border-primary has-[:checked]:bg-primary-50"
                >
                  <input
                    type="radio"
                    name="variant"
                    className="mt-0.5 accent-primary"
                    checked={variantKey === v.key}
                    onChange={() => onVariantChange(v.key)}
                  />
                  <span>{v.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="issuedAt">Datum des Schreibens</Label>
              <Input
                id="issuedAt"
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deadline">Frist zur Abhilfe</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sachverhalt">Sachverhalt (Absatz 1)</Label>
            <Textarea
              id="sachverhalt"
              rows={5}
              value={sachverhalt}
              onChange={(e) => setSachverhalt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Vorbefüllt – passe den Text an den konkreten Fall an.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vorschau */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Vorschau</h2>
        <Card>
          <CardContent className="flex flex-col gap-3 p-6 text-sm leading-relaxed">
            <div className="text-right text-xs text-muted-foreground">
              {sender.fullName || "Absender (Profil)"}
              {sender.addressStreet ? `, ${sender.addressStreet}` : ""}
              {sender.addressZip || sender.addressCity
                ? `, ${[sender.addressZip, sender.addressCity].filter(Boolean).join(" ")}`
                : ""}
            </div>
            {recipient ? (
              <div className="text-muted-foreground">
                {recipient.name}
                <br />
                {recipient.street}
                <br />
                {recipient.zipCity}
              </div>
            ) : (
              <div className="text-muted-foreground italic">
                Empfänger wird aus der Auswahl übernommen.
              </div>
            )}
            <div className="text-right text-xs text-muted-foreground">
              {sender.addressCity ? `${sender.addressCity}, den ` : "Den "}
              {formatDate(issuedAt)}
            </div>
            <p className="font-bold">{subject}</p>
            <p>
              Sehr geehrte/r Frau/Herr{" "}
              {recipient?.lastName || "[Nachname]"},
            </p>
            <p>{sachverhalt}</p>
            <p>
              Wir mahnen Sie hiermit wegen des vorstehend geschilderten
              Verhaltens ausdrücklich ab. Zugleich fordern wir Sie auf, das
              beanstandete Verhalten unverzüglich, spätestens jedoch bis zum{" "}
              {formatDate(deadline)}, einzustellen und künftig zu unterlassen.
            </p>
            <p>{ABMAHNUNG_RECHTSFOLGEN}</p>
            <p>{ABMAHNUNG_GESPRAECH}</p>
            <p>
              Mit freundlichen Grüßen
              <br />
              <br />
              {sender.fullName || "[Vermieter]"}
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
