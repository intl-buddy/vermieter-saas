"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  VorlagenProperty,
  VorlagenSender,
} from "@/lib/vorlagen/loadEntities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntitySelector } from "../EntitySelector";
import { downloadPdf } from "../downloadPdf";

const DEPOSIT_TYPE_LABELS: Record<string, string> = {
  cash_deposit: "Barkaution",
  bank_guarantee: "Bankbürgschaft",
  deposit_insurance: "Kautionsversicherung",
  pledged_savings: "Verpfändetes Sparbuch",
  none: "Keine",
};

function toNum(raw: string): number {
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function MietvertragForm({
  properties,
  sender,
}: {
  properties: VorlagenProperty[];
  sender: VorlagenSender;
}) {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const property = properties.find((p) => p.id === propertyId) ?? null;
  const unit = property?.units.find((u) => u.id === unitId) ?? null;
  const tenant = unit?.tenants.find((t) => t.id === tenantId) ?? null;

  // Editierbare Felder.
  const [mieterAnschrift, setMieterAnschrift] = useState("");
  const [geburtsdatum, setGeburtsdatum] = useState("");
  const [objektAdresseLage, setObjektAdresseLage] = useState("");
  const [rooms, setRooms] = useState("");
  const [mietbeginn, setMietbeginn] = useState("");
  const [grundmiete, setGrundmiete] = useState("");
  const [betriebskosten, setBetriebskosten] = useState("");
  const [heizkosten, setHeizkosten] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const advanceMode = tenant?.advance_mode === "combined" ? "combined" : "split";
  const depositType = tenant?.deposit_type ?? "cash_deposit";
  const iban = property?.rent_iban ?? sender.iban ?? "";

  // Bei Auswahl eines Mieters die Felder aus dem Datenmodell vorbefüllen.
  useEffect(() => {
    if (!property || !unit || !tenant) return;
    setObjektAdresseLage(
      `${property.street} ${property.house_number}, ${property.zip} ${property.city}, ${unit.label}` +
        (unit.floor ? ` (${unit.floor})` : ""),
    );
    setRooms(unit.rooms != null ? String(unit.rooms) : "");
    setMietbeginn(tenant.move_in_date ?? "");
    setGrundmiete(String(tenant.cold_rent ?? 0));
    setBetriebskosten(String(tenant.operating_costs_advance ?? 0));
    setHeizkosten(String(tenant.heating_costs_advance ?? 0));
    setDepositAmount(String(tenant.deposit_amount ?? 0));
    setMieterAnschrift("");
    setGeburtsdatum("");
  }, [property, unit, tenant]);

  const grundmieteNum = toNum(grundmiete);
  const betriebskostenNum = toNum(betriebskosten);
  const heizkostenNum = toNum(heizkosten);
  const combined = advanceMode === "combined";
  const gesamt = grundmieteNum + betriebskostenNum + heizkostenNum;

  const mieterName = tenant
    ? [tenant.first_name, tenant.last_name].filter(Boolean).join(" ").trim()
    : "";

  const payload = useMemo(
    () => ({
      mieterName,
      mieterAnschrift,
      mieterGeburtsdatum: geburtsdatum,
      objektAdresseLage,
      rooms: rooms.trim() || "____",
      mietbeginn,
      grundmiete: grundmieteNum,
      betriebskosten: betriebskostenNum,
      heizkosten: heizkostenNum,
      advanceMode,
      iban,
      depositType,
      depositAmount: toNum(depositAmount),
      filenamePart: tenant?.last_name ?? "Mieter",
    }),
    [
      mieterName,
      mieterAnschrift,
      geburtsdatum,
      objektAdresseLage,
      rooms,
      mietbeginn,
      grundmieteNum,
      betriebskostenNum,
      heizkostenNum,
      advanceMode,
      iban,
      depositType,
      depositAmount,
      tenant,
    ],
  );

  async function onGenerate() {
    if (!tenant) {
      toast.error("Bitte Objekt, Einheit und Mieter auswählen.");
      return;
    }
    setPending(true);
    try {
      await downloadPdf("/api/vorlagen/mietvertrag", payload);
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

      {tenant ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-5 p-6">
              <h2 className="text-base font-semibold">Vertragsparteien</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Vermieter</Label>
                  <Input value={sender.fullName} disabled />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Mieter</Label>
                  <Input value={mieterName} disabled />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mieterAnschrift">Anschrift des Mieters</Label>
                  <Input
                    id="mieterAnschrift"
                    value={mieterAnschrift}
                    onChange={(e) => setMieterAnschrift(e.target.value)}
                    placeholder="Straße Hausnr., PLZ Ort"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="geburtsdatum">Geburtsdatum des Mieters</Label>
                  <Input
                    id="geburtsdatum"
                    type="date"
                    value={geburtsdatum}
                    onChange={(e) => setGeburtsdatum(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-5 p-6">
              <h2 className="text-base font-semibold">
                Mietsache &amp; Mietbeginn
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="objekt">Adresse, Lage (§ 1)</Label>
                  <Input
                    id="objekt"
                    value={objektAdresseLage}
                    onChange={(e) => setObjektAdresseLage(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rooms">Zimmerzahl</Label>
                  <Input
                    id="rooms"
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    placeholder="z. B. 3"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mietbeginn">Mietbeginn (§ 2)</Label>
                  <Input
                    id="mietbeginn"
                    type="date"
                    value={mietbeginn}
                    onChange={(e) => setMietbeginn(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-5 p-6">
              <h2 className="text-base font-semibold">Miete &amp; Kaution</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="grundmiete">Grundmiete (€)</Label>
                  <Input
                    id="grundmiete"
                    type="number"
                    step="0.01"
                    min="0"
                    value={grundmiete}
                    onChange={(e) => setGrundmiete(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="betriebskosten">
                    {combined
                      ? "Nebenkostenvorauszahlung (€)"
                      : "Betriebskosten-VZ (€)"}
                  </Label>
                  <Input
                    id="betriebskosten"
                    type="number"
                    step="0.01"
                    min="0"
                    value={betriebskosten}
                    onChange={(e) => setBetriebskosten(e.target.value)}
                  />
                </div>
                {!combined ? (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="heizkosten">Heizkosten-VZ (€)</Label>
                    <Input
                      id="heizkosten"
                      type="number"
                      step="0.01"
                      min="0"
                      value={heizkosten}
                      onChange={(e) => setHeizkosten(e.target.value)}
                    />
                  </div>
                ) : null}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deposit">Kaution (€)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Vorauszahlungs-Modus:{" "}
                {combined
                  ? "kombiniert (Nebenkosten inkl. Heizung)"
                  : "getrennt (Betriebs- und Heizkosten)"}
                {" · "}
                Kautionsart: {DEPOSIT_TYPE_LABELS[depositType] ?? depositType}
              </p>
            </CardContent>
          </Card>

          {/* Zusammenfassung / Vorschau */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Vorschau</h2>
            <Card>
              <CardContent className="flex flex-col gap-1.5 p-6 text-sm">
                <SummaryRow label="Vermieter" value={sender.fullName || "–"} />
                <SummaryRow label="Mieter" value={mieterName || "–"} />
                <SummaryRow
                  label="Geburtsdatum"
                  value={geburtsdatum ? formatDate(geburtsdatum) : "– (bitte ergänzen)"}
                />
                <SummaryRow label="Mietsache" value={objektAdresseLage || "–"} />
                <SummaryRow
                  label="Mietbeginn"
                  value={mietbeginn ? formatDate(mietbeginn) : "–"}
                />
                <SummaryRow
                  label="Grundmiete"
                  value={formatCurrency(grundmieteNum)}
                />
                <SummaryRow
                  label={combined ? "Nebenkostenvorauszahlung" : "Betriebskosten-VZ"}
                  value={formatCurrency(betriebskostenNum)}
                />
                {!combined ? (
                  <SummaryRow
                    label="Heizkosten-VZ"
                    value={formatCurrency(heizkostenNum)}
                  />
                ) : null}
                <SummaryRow
                  label="Gesamtmiete"
                  value={formatCurrency(gesamt)}
                  bold
                />
                <SummaryRow
                  label="Kaution"
                  value={`${formatCurrency(toNum(depositAmount))} (${DEPOSIT_TYPE_LABELS[depositType] ?? depositType})`}
                />
                <SummaryRow label="Bankverbindung (IBAN)" value={iban || "–"} />
              </CardContent>
            </Card>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-semibold">
                Mustervorlage – ersetzt keine Rechtsberatung.
              </span>{" "}
              Prüfe den Vertrag vor Verwendung, insbesondere bei besonderen
              Vereinbarungen.
            </span>
          </div>

          <div>
            <Button onClick={onGenerate} disabled={pending}>
              {pending ? "PDF wird erzeugt …" : "Mietvertrag erzeugen"}
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Wähle Objekt, Einheit und Mieter, um die Vertragsdaten zu befüllen.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={bold ? "font-semibold tabular-nums" : "tabular-nums text-right"}
      >
        {value}
      </span>
    </div>
  );
}
