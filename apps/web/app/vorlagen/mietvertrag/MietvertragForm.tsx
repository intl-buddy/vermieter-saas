"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EntitySelector } from "../EntitySelector";
import { downloadPdf } from "../downloadPdf";

const DEPOSIT_TYPES = [
  { value: "cash_deposit", label: "Barkaution" },
  { value: "bank_guarantee", label: "Bankbürgschaft" },
  { value: "deposit_insurance", label: "Kautionsversicherung" },
  { value: "pledged_savings", label: "Verpfändetes Sparbuch" },
  { value: "none", label: "Keine" },
];

const MIETARTEN = [
  { value: "standard", label: "Standardmiete (§ 558 BGB)" },
  { value: "staffel", label: "Staffelmiete (§ 557a BGB)" },
  { value: "index", label: "Indexmiete (§ 557b BGB)" },
];

const ANLAGEN = [
  { key: "betrkv", label: "Anlage 1 – Betriebskostenverordnung" },
  { key: "sepa", label: "Anlage 2 – SEPA-Lastschriftmandat" },
  { key: "hausordnung", label: "Anlage 3 – Hausordnung" },
  { key: "lueftung", label: "Anlage 4 – Hinweise zur Belüftung und Beheizung" },
] as const;

type Staffel = { ab: string; miete: string };

function toNum(raw: string): number {
  const n = raw.includes(",")
    ? Number(raw.replace(/\./g, "").replace(",", "."))
    : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function daysBetween(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00`);
  const db = Date.parse(`${b}T00:00:00`);
  if (!Number.isFinite(da) || !Number.isFinite(db)) return NaN;
  return Math.round((db - da) / 86_400_000);
}

export function MietvertragForm({
  properties,
  sender,
  onSelectedUnitType,
}: {
  properties: VorlagenProperty[];
  sender: VorlagenSender;
  /** Meldet den unit_type der gewählten Einheit (für die Vertragstyp-Empfehlung). */
  onSelectedUnitType?: (unitType: string | null) => void;
}) {
  const [mode, setMode] = useState<"tefter" | "manual">("tefter");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Parteien
  const [mieterName, setMieterName] = useState("");
  const [mieterAnschrift, setMieterAnschrift] = useState("");
  const [geburtsdatum, setGeburtsdatum] = useState("");
  // Mietsache
  const [objektAdresseLage, setObjektAdresseLage] = useState("");
  const [zimmer, setZimmer] = useState("");
  const [kuechen, setKuechen] = useState("1");
  const [baeder, setBaeder] = useState("1");
  const [keller, setKeller] = useState(false);
  const [balkon, setBalkon] = useState(false);
  const [stellplatz, setStellplatz] = useState(false);
  const [stellplatzBez, setStellplatzBez] = useState("");
  const [stellplatzMiete, setStellplatzMiete] = useState("0");
  // Mietzeit & Miete
  const [mietbeginn, setMietbeginn] = useState("");
  const [grundmiete, setGrundmiete] = useState("");
  const [advanceMode, setAdvanceMode] = useState<"split" | "combined">("split");
  const [betriebskosten, setBetriebskosten] = useState("");
  const [heizkosten, setHeizkosten] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  // Mietart
  const [mietart, setMietart] = useState("standard");
  const [staffeln, setStaffeln] = useState<Staffel[]>([]);
  // Kaution
  const [depositType, setDepositType] = useState("cash_deposit");
  const [depositAmount, setDepositAmount] = useState("");
  // Besondere Vereinbarungen
  const [besondere, setBesondere] = useState("");
  // Anlagen
  const [anlagen, setAnlagen] = useState({
    betrkv: false,
    sepa: false,
    hausordnung: false,
    lueftung: false,
  });

  const property = properties.find((p) => p.id === propertyId) ?? null;
  const unit = property?.units.find((u) => u.id === unitId) ?? null;
  const tenant = unit?.tenants.find((t) => t.id === tenantId) ?? null;

  // Objektfelder aus der Einheit vorbefüllen (beide Modi).
  useEffect(() => {
    if (!property || !unit) return;
    setObjektAdresseLage(
      `${property.street} ${property.house_number}, ${property.zip} ${property.city}, ${unit.label}` +
        (unit.floor ? ` (${unit.floor})` : ""),
    );
    setZimmer(unit.rooms != null ? String(unit.rooms) : "");
  }, [property, unit]);

  // unit_type der Auswahl nach oben melden (Vertragstyp-Empfehlung).
  useEffect(() => {
    onSelectedUnitType?.(unit?.unit_type ?? null);
  }, [unit, onSelectedUnitType]);

  // Mieter- und Mietdaten aus dem Mietverhältnis vorbefüllen (tefter-Modus).
  useEffect(() => {
    if (!tenant || !property) return;
    setMieterName(
      [tenant.first_name, tenant.last_name].filter(Boolean).join(" ").trim(),
    );
    setMietbeginn(tenant.move_in_date ?? "");
    setGrundmiete(String(tenant.cold_rent ?? 0));
    setBetriebskosten(String(tenant.operating_costs_advance ?? 0));
    setHeizkosten(String(tenant.heating_costs_advance ?? 0));
    setAdvanceMode(tenant.advance_mode === "combined" ? "combined" : "split");
    setDepositType(tenant.deposit_type ?? "cash_deposit");
    setDepositAmount(String(tenant.deposit_amount ?? 0));
    setIban(property.rent_iban ?? sender.iban ?? "");
    setBic(sender.bic ?? "");
  }, [tenant, property, sender]);

  function changeMode(m: "tefter" | "manual") {
    setMode(m);
    if (m === "manual") {
      setTenantId(null);
      setMieterName("");
      setMieterAnschrift("");
      setGeburtsdatum("");
    }
  }

  const combined = advanceMode === "combined";
  const grundmieteNum = toNum(grundmiete);
  const betriebskostenNum = toNum(betriebskosten);
  const heizkostenNum = combined ? 0 : toNum(heizkosten);
  const stellplatzMieteNum = stellplatz ? toNum(stellplatzMiete) : 0;
  const gesamt =
    grundmieteNum +
    betriebskostenNum +
    (combined ? 0 : heizkostenNum) +
    stellplatzMieteNum;

  const canGenerate = mieterName.trim().length > 0;

  function validateStaffeln(): string | null {
    if (mietart !== "staffel") return null;
    if (staffeln.length === 0)
      return "Bitte mindestens eine Staffel angeben.";
    let prev = mietbeginn;
    for (let i = 0; i < staffeln.length; i++) {
      const s = staffeln[i]!;
      if (!s.ab) return `Staffel ${i + 1}: Bitte ein Datum angeben.`;
      if (prev) {
        const d = daysBetween(prev, s.ab);
        if (!Number.isFinite(d) || d < 365) {
          return `Staffel ${i + 1}: Zwischen den Staffeln muss mindestens ein Jahr liegen.`;
        }
      }
      prev = s.ab;
    }
    return null;
  }

  const payload = useMemo(
    () => ({
      mieterName,
      mieterAnschrift,
      mieterGeburtsdatum: geburtsdatum,
      objektAdresseLage,
      zimmer,
      kuechen: toNum(kuechen),
      baeder: toNum(baeder),
      keller,
      balkon,
      stellplatz,
      stellplatzBez,
      stellplatzMiete: stellplatzMieteNum,
      mietbeginn,
      grundmiete: grundmieteNum,
      betriebskosten: betriebskostenNum,
      heizkosten: heizkostenNum,
      advanceMode,
      mietart,
      staffeln: staffeln.map((s) => ({ ab: s.ab, miete: toNum(s.miete) })),
      iban,
      bic,
      depositType,
      depositAmount: toNum(depositAmount),
      besondere,
      anlagen,
      filenamePart: mieterName || "Mieter",
    }),
    [
      mieterName, mieterAnschrift, geburtsdatum, objektAdresseLage, zimmer,
      kuechen, baeder, keller, balkon, stellplatz, stellplatzBez,
      stellplatzMieteNum, mietbeginn, grundmieteNum, betriebskostenNum,
      heizkostenNum, advanceMode, mietart, staffeln, iban, bic, depositType,
      depositAmount, besondere, anlagen,
    ],
  );

  async function onGenerate() {
    if (!canGenerate) {
      toast.error("Bitte mindestens den Namen des Mieters angeben.");
      return;
    }
    const staffelError = validateStaffeln();
    if (staffelError) {
      toast.error(staffelError);
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
      {/* Modus-Umschalter */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="inline-flex w-full max-w-md overflow-hidden rounded-xl border border-neutral-200">
            {(["tefter", "manual"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => changeMode(m)}
                className={
                  "flex-1 px-4 py-2 text-sm font-medium transition-colors " +
                  (mode === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-neutral-600 hover:bg-neutral-50")
                }
              >
                {m === "tefter" ? "Mieter aus tefter wählen" : "Daten manuell eingeben"}
              </button>
            ))}
          </div>

          <EntitySelector
            properties={properties}
            propertyId={propertyId}
            unitId={unitId}
            tenantId={tenantId}
            showTenant={mode === "tefter"}
            onChange={(next) => {
              setPropertyId(next.propertyId);
              setUnitId(next.unitId);
              setTenantId(next.tenantId);
            }}
          />
          {mode === "manual" ? (
            <p className="text-xs text-muted-foreground">
              Objekt/Einheit optional aus dem Bestand übernehmen – alle Felder
              bleiben frei editierbar.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Vertragsparteien */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <h2 className="text-base font-semibold">Vertragsparteien</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Vermieter</Label>
              <Input value={sender.fullName} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mieterName">Mieter (Name)</Label>
              <Input
                id="mieterName"
                value={mieterName}
                onChange={(e) => setMieterName(e.target.value)}
              />
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

      {/* Mietsache */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <h2 className="text-base font-semibold">Mietsache (§ 1)</h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="objekt">Adresse, Lage</Label>
            <Input
              id="objekt"
              value={objektAdresseLage}
              onChange={(e) => setObjektAdresseLage(e.target.value)}
              placeholder="Straße Hausnr., PLZ Ort, Einheit (Lage)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="zimmer">Zimmer</Label>
              <Input id="zimmer" value={zimmer} onChange={(e) => setZimmer(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kuechen">Küchen</Label>
              <Input id="kuechen" type="number" min="0" value={kuechen} onChange={(e) => setKuechen(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="baeder">Bäder / WC</Label>
              <Input id="baeder" type="number" min="0" value={baeder} onChange={(e) => setBaeder(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={keller} onCheckedChange={setKeller} />
              Keller
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={balkon} onCheckedChange={setBalkon} />
              Balkon / Terrasse
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={stellplatz} onCheckedChange={setStellplatz} />
              Stellplatz / Garage mitvermietet
            </label>
          </div>
          {stellplatz ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="spBez">Bezeichnung / Nummer</Label>
                <Input id="spBez" value={stellplatzBez} onChange={(e) => setStellplatzBez(e.target.value)} placeholder="z. B. Stellplatz Nr. 7" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="spMiete">Stellplatzmiete (€)</Label>
                <Input id="spMiete" type="number" step="0.01" min="0" value={stellplatzMiete} onChange={(e) => setStellplatzMiete(e.target.value)} />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Mietzeit & Miete */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <h2 className="text-base font-semibold">Mietbeginn &amp; Miete</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mietbeginn">Mietbeginn (§ 2)</Label>
              <Input id="mietbeginn" type="date" value={mietbeginn} onChange={(e) => setMietbeginn(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grundmiete">Grundmiete (€)</Label>
              <Input id="grundmiete" type="number" step="0.01" min="0" value={grundmiete} onChange={(e) => setGrundmiete(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Vorauszahlungen</Label>
            <div className="flex flex-wrap gap-2">
              {(["split", "combined"] as const).map((v) => (
                <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-50">
                  <input type="radio" name="advanceMode" className="accent-primary" checked={advanceMode === v} onChange={() => setAdvanceMode(v)} />
                  {v === "split" ? "Getrennt (Betriebs- + Heizkosten)" : "Kombiniert (Nebenkosten)"}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bk">{combined ? "Nebenkostenvorauszahlung (€)" : "Betriebskosten-VZ (€)"}</Label>
              <Input id="bk" type="number" step="0.01" min="0" value={betriebskosten} onChange={(e) => setBetriebskosten(e.target.value)} />
            </div>
            {!combined ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hk">Heizkosten-VZ (€)</Label>
                <Input id="hk" type="number" step="0.01" min="0" value={heizkosten} onChange={(e) => setHeizkosten(e.target.value)} />
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bic">BIC (optional)</Label>
              <Input id="bic" value={bic} onChange={(e) => setBic(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mietart */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <h2 className="text-base font-semibold">Mietart (§ 5)</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {MIETARTEN.map((m) => (
              <label key={m.value} className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-200 p-3 text-sm hover:bg-neutral-50 has-[:checked]:border-primary has-[:checked]:bg-primary-50">
                <input type="radio" name="mietart" className="mt-0.5 accent-primary" checked={mietart === m.value} onChange={() => setMietart(m.value)} />
                <span>{m.label}</span>
              </label>
            ))}
          </div>

          {mietart === "staffel" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Staffeln – Ausgangswert ist die Grundmiete gemäß § 4.1. Zwischen
                den Staffeln muss mindestens ein Jahr liegen.
              </p>
              {staffeln.map((s, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label>Ab Datum</Label>
                    <Input
                      type="date"
                      value={s.ab}
                      onChange={(e) =>
                        setStaffeln((prev) => prev.map((x, j) => (j === i ? { ...x, ab: e.target.value } : x)))
                      }
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label>Neue Kaltmiete (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={s.miete}
                      onChange={(e) =>
                        setStaffeln((prev) => prev.map((x, j) => (j === i ? { ...x, miete: e.target.value } : x)))
                      }
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setStaffeln((prev) => prev.filter((_, j) => j !== i))} aria-label="Staffel entfernen">
                    <Trash2 className="size-4 text-danger-600" />
                  </Button>
                </div>
              ))}
              <div>
                <Button type="button" variant="outline" size="sm" onClick={() => setStaffeln((prev) => [...prev, { ab: "", miete: "" }])}>
                  <Plus className="size-4" />
                  Staffel hinzufügen
                </Button>
              </div>
            </div>
          ) : null}

          {mietart === "index" ? (
            <p className="text-sm text-muted-foreground">
              Die Grundmiete wird als Indexmiete gemäß § 557b BGB an den
              Verbraucherpreisindex des Statistischen Bundesamts (Basisjahr 2020
              = 100) gekoppelt. Der entsprechende Klauseltext wird automatisch
              eingefügt.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Kaution */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="depositType">Kautionsart (§ 8)</Label>
            <Select value={depositType} onValueChange={setDepositType}>
              <SelectTrigger id="depositType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPOSIT_TYPES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {depositType !== "none" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deposit">Kaution (€)</Label>
              <Input id="deposit" type="number" step="0.01" min="0" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Besondere Vereinbarungen */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-6">
          <Label htmlFor="besondere">Besondere Vereinbarungen (§ 25)</Label>
          <Textarea id="besondere" rows={3} value={besondere} onChange={(e) => setBesondere(e.target.value)} placeholder="Optional – leer bleibt „Keine.“" />
        </CardContent>
      </Card>

      {/* Anlagen */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          <h2 className="text-base font-semibold">Anlagen</h2>
          {ANLAGEN.map((a) => (
            <label key={a.key} className="flex items-center justify-between gap-3 text-sm">
              <span>{a.label}</span>
              <Switch
                checked={anlagen[a.key]}
                onCheckedChange={(v) => setAnlagen((prev) => ({ ...prev, [a.key]: v }))}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Vorschau */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Vorschau</h2>
        <Card>
          <CardContent className="flex flex-col gap-1.5 p-6 text-sm">
            <SummaryRow label="Vermieter" value={sender.fullName || "–"} />
            <SummaryRow label="Mieter" value={mieterName || "–"} />
            <SummaryRow label="Geburtsdatum" value={geburtsdatum ? formatDate(geburtsdatum) : "–"} />
            <SummaryRow label="Mietsache" value={objektAdresseLage || "–"} />
            <SummaryRow label="Mietbeginn" value={mietbeginn ? formatDate(mietbeginn) : "–"} />
            <SummaryRow label="Mietart" value={MIETARTEN.find((m) => m.value === mietart)?.label ?? mietart} />
            <SummaryRow label="Grundmiete" value={formatCurrency(grundmieteNum)} />
            {stellplatz ? (
              <SummaryRow label="Stellplatzmiete" value={formatCurrency(stellplatzMieteNum)} />
            ) : null}
            <SummaryRow label="Gesamtmiete" value={formatCurrency(gesamt)} bold />
            <SummaryRow
              label="Anlagen"
              value={
                ANLAGEN.filter((a) => anlagen[a.key])
                  .map((a) => a.label.split(" – ")[0])
                  .join(", ") || "keine"
              }
            />
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
        <Button onClick={onGenerate} disabled={pending || !canGenerate}>
          {pending ? "PDF wird erzeugt …" : "Mietvertrag erzeugen"}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold tabular-nums" : "tabular-nums text-right"}>
        {value}
      </span>
    </div>
  );
}
