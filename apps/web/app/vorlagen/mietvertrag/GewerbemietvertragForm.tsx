"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info, Plus, Trash2 } from "lucide-react";
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
import { EntitySelector } from "../EntitySelector";
import { downloadPdf } from "../downloadPdf";

const ANPASSUNG = [
  { value: "standard", label: "Mieterhöhung nach § 558 BGB" },
  { value: "staffel", label: "Staffelmiete" },
  { value: "index", label: "Indexmiete" },
];

const ANLAGEN = [
  { key: "betrkv", label: "Anlage 1 – Betriebskostenverordnung" },
  { key: "sepa", label: "Anlage 2 – SEPA-Lastschriftmandat" },
  { key: "hausordnung", label: "Anlage 3 – Hausordnung" },
] as const;

type Raum = { etage: string; beschreibung: string };
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

/** Label mit ⓘ-Hinweis (Anmerkung aus der Vorlage). */
function HintLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{children}</Label>
      <span title={hint} className="cursor-help text-muted-foreground">
        <Info className="size-3.5" />
      </span>
    </span>
  );
}

export function GewerbemietvertragForm({
  properties,
  sender,
  onSelectedUnitType,
}: {
  properties: VorlagenProperty[];
  sender: VorlagenSender;
  onSelectedUnitType?: (unitType: string | null) => void;
}) {
  const [mode, setMode] = useState<"tefter" | "manual">("tefter");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Parteien
  const [mieterFirma, setMieterFirma] = useState("");
  const [mieterVertreter, setMieterVertreter] = useState("");
  const [mieterAnschrift, setMieterAnschrift] = useState("");
  // Mieträume
  const [objektAdresse, setObjektAdresse] = useState("");
  const [raeume, setRaeume] = useState<Raum[]>([{ etage: "", beschreibung: "" }]);
  const [mietflaeche, setMietflaeche] = useState("");
  const [schluessel, setSchluessel] = useState("");
  // Mietzweck
  const [mietzweck, setMietzweck] = useState("");
  // Zustand
  const [renovierungsbeduerftig, setRenovierungsbeduerftig] = useState(false);
  const [rueckgabeRenoviert, setRueckgabeRenoviert] = useState(false);
  const [inventar, setInventar] = useState("");
  // Mietzeit
  const [mietbeginn, setMietbeginn] = useState("");
  const [laufzeitJahre, setLaufzeitJahre] = useState("5");
  const [verlaengerungAnzahl, setVerlaengerungAnzahl] = useState("1");
  const [verlaengerungJahre, setVerlaengerungJahre] = useState("1");
  // Miete
  const [nettoGrundmiete, setNettoGrundmiete] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [betriebskosten, setBetriebskosten] = useState("");
  const [sonstigeKostenBez, setSonstigeKostenBez] = useState("");
  const [sonstigeKostenBetrag, setSonstigeKostenBetrag] = useState("");
  const [ustOption, setUstOption] = useState(false);
  // Anpassung
  const [anpassung, setAnpassung] = useState("standard");
  const [staffeln, setStaffeln] = useState<Staffel[]>([]);
  // Kaution
  const [kaution, setKaution] = useState("");
  // Instandhaltung
  const [instandEinzelfall, setInstandEinzelfall] = useState("");
  const [instandJahr, setInstandJahr] = useState("");
  // Außenreklame / Sachen / Wettbewerb
  const [aussenreklame, setAussenreklame] = useState("");
  const [ausgenommeneSachen, setAusgenommeneSachen] = useState("");
  const [wettbewerbsschutz, setWettbewerbsschutz] = useState("ausschliessen");
  // Gerichtsstand / Besondere
  const [gerichtsstand, setGerichtsstand] = useState("");
  const [besondere, setBesondere] = useState("");
  // Anlagen
  const [anlagen, setAnlagen] = useState({
    betrkv: false,
    sepa: false,
    hausordnung: false,
  });

  const property = properties.find((p) => p.id === propertyId) ?? null;
  const unit = property?.units.find((u) => u.id === unitId) ?? null;
  const tenant = unit?.tenants.find((t) => t.id === tenantId) ?? null;

  // Objektfelder aus der Einheit vorbefüllen (beide Modi).
  useEffect(() => {
    if (!property) return;
    setObjektAdresse(
      `${property.street} ${property.house_number}, ${property.zip} ${property.city}`,
    );
    setGerichtsstand((prev) => prev || property.city);
    if (unit) {
      setRaeume([
        {
          etage: unit.floor ?? "",
          beschreibung: unit.label,
        },
      ]);
      setMietflaeche(unit.living_area != null ? String(unit.living_area) : "");
    }
  }, [property, unit]);

  // unit_type der Auswahl nach oben melden (Vertragstyp-Empfehlung).
  useEffect(() => {
    onSelectedUnitType?.(unit?.unit_type ?? null);
  }, [unit, onSelectedUnitType]);

  // Miet-/Mieterdaten aus dem Mietverhältnis vorbefüllen (tefter-Modus).
  useEffect(() => {
    if (!tenant || !property) return;
    setMieterFirma(
      [tenant.first_name, tenant.last_name].filter(Boolean).join(" ").trim(),
    );
    setMietbeginn(tenant.move_in_date ?? "");
    setNettoGrundmiete(String(tenant.cold_rent ?? 0));
    setBetriebskosten(String(tenant.operating_costs_advance ?? 0));
    setKaution(String(tenant.deposit_amount ?? 0));
    setIban(property.rent_iban ?? sender.iban ?? "");
    setBic(sender.bic ?? "");
    setBankName(sender.bankName ?? "");
  }, [tenant, property, sender]);

  function changeMode(m: "tefter" | "manual") {
    setMode(m);
    if (m === "manual") {
      setTenantId(null);
      setMieterFirma("");
      setMieterVertreter("");
      setMieterAnschrift("");
    }
  }

  const nettoNum = toNum(nettoGrundmiete);
  const betriebskostenNum = toNum(betriebskosten);
  const sonstigeNum = toNum(sonstigeKostenBetrag);
  const monatlichNetto = nettoNum + betriebskostenNum + sonstigeNum;
  const brutto = monatlichNetto * 1.19;

  const canGenerate =
    mieterFirma.trim().length > 0 && mietzweck.trim().length > 0;

  function validateStaffeln(): string | null {
    if (anpassung !== "staffel") return null;
    if (staffeln.length === 0) return "Bitte mindestens eine Staffel angeben.";
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
      mieterFirma,
      mieterVertreter,
      mieterAnschrift,
      objektAdresse,
      raeume: raeume.filter((r) => r.etage.trim() || r.beschreibung.trim()),
      mietflaeche: toNum(mietflaeche),
      schluessel,
      mietzweck,
      renovierungsbeduerftig,
      rueckgabeRenoviert,
      inventar,
      mietbeginn,
      laufzeitJahre: toNum(laufzeitJahre),
      verlaengerungAnzahl: toNum(verlaengerungAnzahl),
      verlaengerungJahre: toNum(verlaengerungJahre),
      nettoGrundmiete: nettoNum,
      bankName,
      iban,
      bic,
      betriebskosten: betriebskostenNum,
      sonstigeKostenBez,
      sonstigeKostenBetrag: sonstigeNum,
      ustOption,
      anpassung,
      staffeln: staffeln.map((s) => ({ ab: s.ab, miete: toNum(s.miete) })),
      kaution: toNum(kaution),
      instandEinzelfall: toNum(instandEinzelfall),
      instandJahr: toNum(instandJahr),
      aussenreklame,
      ausgenommeneSachen,
      wettbewerbsschutz,
      gerichtsstand,
      besondere,
      anlagen,
      filenamePart: mieterFirma || "Mieter",
    }),
    [
      mieterFirma, mieterVertreter, mieterAnschrift, objektAdresse, raeume,
      mietflaeche, schluessel, mietzweck, renovierungsbeduerftig,
      rueckgabeRenoviert, inventar, mietbeginn, laufzeitJahre,
      verlaengerungAnzahl, verlaengerungJahre, nettoNum, bankName, iban, bic,
      betriebskostenNum, sonstigeKostenBez, sonstigeNum, ustOption, anpassung,
      staffeln, kaution, instandEinzelfall, instandJahr, aussenreklame,
      ausgenommeneSachen, wettbewerbsschutz, gerichtsstand, besondere, anlagen,
    ],
  );

  async function onGenerate() {
    if (!canGenerate) {
      toast.error("Bitte Firmenname des Mieters und Mietzweck angeben.");
      return;
    }
    const staffelError = validateStaffeln();
    if (staffelError) {
      toast.error(staffelError);
      return;
    }
    setPending(true);
    try {
      await downloadPdf("/api/vorlagen/gewerbemietvertrag", payload);
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
              <Label htmlFor="mieterFirma">Mieter (Firma / Bezeichnung)</Label>
              <Input
                id="mieterFirma"
                value={mieterFirma}
                onChange={(e) => setMieterFirma(e.target.value)}
                placeholder="z. B. Muster GmbH"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mieterVertreter">Vertreten durch</Label>
              <Input
                id="mieterVertreter"
                value={mieterVertreter}
                onChange={(e) => setMieterVertreter(e.target.value)}
                placeholder="Name des/der Geschäftsführer:in"
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
          </div>
        </CardContent>
      </Card>

      {/* Mieträume */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <HintLabel hint="Das Mietobjekt und seine Nutzung sollten genau festgelegt werden, um spätere Streitigkeiten zu vermeiden.">
            <span className="text-base font-semibold">Mieträume (Ziffer 1)</span>
          </HintLabel>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="objektAdresse">Haus (Straße, Hausnummer, PLZ)</Label>
            <Input
              id="objektAdresse"
              value={objektAdresse}
              onChange={(e) => setObjektAdresse(e.target.value)}
              placeholder="Straße Hausnr., PLZ Ort"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label>Raumaufstellung</Label>
            {raeume.map((r, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex w-32 flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Etage</Label>
                  <Input
                    value={r.etage}
                    onChange={(e) =>
                      setRaeume((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, etage: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="z. B. Erdgeschoss"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Beschreibung
                  </Label>
                  <Input
                    value={r.beschreibung}
                    onChange={(e) =>
                      setRaeume((prev) =>
                        prev.map((x, j) =>
                          j === i ? { ...x, beschreibung: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="z. B. Ladenlokal, 2 Büros, WC"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setRaeume((prev) => prev.filter((_, j) => j !== i))
                  }
                  aria-label="Raum entfernen"
                >
                  <Trash2 className="size-4 text-danger-600" />
                </Button>
              </div>
            ))}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setRaeume((prev) => [...prev, { etage: "", beschreibung: "" }])
                }
              >
                <Plus className="size-4" />
                Raum hinzufügen
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mietflaeche">Mietfläche (qm)</Label>
              <Input
                id="mietflaeche"
                type="number"
                step="0.01"
                min="0"
                value={mietflaeche}
                onChange={(e) => setMietflaeche(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="schluessel">Schlüsselliste</Label>
            <Textarea
              id="schluessel"
              rows={2}
              value={schluessel}
              onChange={(e) => setSchluessel(e.target.value)}
              placeholder="z. B. 3 Haustürschlüssel, 2 Ladenschlüssel, 1 Kellerschlüssel"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mietzweck */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          <HintLabel htmlFor="mietzweck" hint="Genaue Beschreibung des Nutzungszwecks – je präziser, desto weniger Streit über die zulässige Nutzung.">
            Mietzweck (Ziffer 2) *
          </HintLabel>
          <Textarea
            id="mietzweck"
            rows={2}
            value={mietzweck}
            onChange={(e) => setMietzweck(e.target.value)}
            placeholder="z. B. Betrieb eines Cafés mit Außengastronomie"
          />
        </CardContent>
      </Card>

      {/* Zustand */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <h2 className="text-base font-semibold">
            Zustand &amp; Rückgabe (Ziffer 3)
          </h2>
          <div className="flex flex-col gap-3">
            <Label>Zustand bei Übernahme</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { v: false, label: "Nicht renovierungsbedürftig" },
                { v: true, label: "Renovierungsbedürftig" },
              ].map((o) => (
                <label
                  key={String(o.v)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-50"
                >
                  <input
                    type="radio"
                    name="uebernahme"
                    className="accent-primary"
                    checked={renovierungsbeduerftig === o.v}
                    onChange={() => setRenovierungsbeduerftig(o.v)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label>Rückgabezustand</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { v: false, label: "Im gleichen Zustand" },
                { v: true, label: "Renoviert" },
              ].map((o) => (
                <label
                  key={String(o.v)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-50"
                >
                  <input
                    type="radio"
                    name="rueckgabe"
                    className="accent-primary"
                    checked={rueckgabeRenoviert === o.v}
                    onChange={() => setRueckgabeRenoviert(o.v)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inventar">Inventar (optional)</Label>
            <Textarea
              id="inventar"
              rows={2}
              value={inventar}
              onChange={(e) => setInventar(e.target.value)}
              placeholder="Mitvermietetes Inventar, z. B. Einbauküche, Theke"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mietzeit */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <h2 className="text-base font-semibold">Mietzeit (Ziffer 4)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mietbeginn">Mietbeginn</Label>
              <Input
                id="mietbeginn"
                type="date"
                value={mietbeginn}
                onChange={(e) => setMietbeginn(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="laufzeit">Feste Laufzeit (Jahre)</Label>
              <Input
                id="laufzeit"
                type="number"
                min="1"
                step="1"
                value={laufzeitJahre}
                onChange={(e) => setLaufzeitJahre(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="verlAnzahl">Verlängerungen (Anzahl)</Label>
              <Input
                id="verlAnzahl"
                type="number"
                min="0"
                step="1"
                value={verlaengerungAnzahl}
                onChange={(e) => setVerlaengerungAnzahl(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="verlJahre">je Verlängerung (Jahre)</Label>
              <Input
                id="verlJahre"
                type="number"
                min="0"
                step="1"
                value={verlaengerungJahre}
                onChange={(e) => setVerlaengerungJahre(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Befristetes Mietverhältnis mit Verlängerungsoption – das Enddatum
            wird aus Mietbeginn und Laufzeit automatisch berechnet.
          </p>
        </CardContent>
      </Card>

      {/* Mietzins */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <h2 className="text-base font-semibold">Mietzins (Ziffer 6)</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="netto">Netto-Grundmiete (€ / Monat)</Label>
              <Input
                id="netto"
                type="number"
                step="0.01"
                min="0"
                value={nettoGrundmiete}
                onChange={(e) => setNettoGrundmiete(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bk">Betriebskosten-Vorauszahlung (€)</Label>
              <Input
                id="bk"
                type="number"
                step="0.01"
                min="0"
                value={betriebskosten}
                onChange={(e) => setBetriebskosten(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <HintLabel htmlFor="sonstBez" hint="Eine spezifizierte Auflistung ist empfehlenswert.">
                Sonstige Kosten – Bezeichnung
              </HintLabel>
              <Input
                id="sonstBez"
                value={sonstigeKostenBez}
                onChange={(e) => setSonstigeKostenBez(e.target.value)}
                placeholder="z. B. Reinigung Gemeinflächen"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sonstBetrag">Sonstige Kosten (€)</Label>
              <Input
                id="sonstBetrag"
                type="number"
                step="0.01"
                min="0"
                value={sonstigeKostenBetrag}
                onChange={(e) => setSonstigeKostenBetrag(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm">
            <span className="flex items-center gap-1.5">
              Option zur Umsatzsteuer (§ 9 UStG)
              <span
                title="Nur bei Vermietung an vorsteuerabzugsberechtigte Unternehmer möglich. Bei Option ist die USt zusätzlich zur Nettomiete zu zahlen."
                className="cursor-help text-muted-foreground"
              >
                <Info className="size-3.5" />
              </span>
            </span>
            <Switch checked={ustOption} onCheckedChange={setUstOption} />
          </label>
          {ustOption ? (
            <p className="text-xs text-muted-foreground">
              Ausweis „zzgl. USt in gesetzlicher Höhe". Informativ (19 %):{" "}
              {formatCurrency(monatlichNetto)} netto ={" "}
              <span className="font-medium">{formatCurrency(brutto)}</span> brutto.
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bankName">Bank</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="z. B. Sparkasse"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="iban2">IBAN</Label>
              <Input id="iban2" value={iban} onChange={(e) => setIban(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bic2">BIC (optional)</Label>
              <Input id="bic2" value={bic} onChange={(e) => setBic(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anpassung des Mietzinses */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <h2 className="text-base font-semibold">
            Anpassung des Mietzinses (Ziffer 7)
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ANPASSUNG.map((m) => (
              <label
                key={m.value}
                className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-200 p-3 text-sm hover:bg-neutral-50 has-[:checked]:border-primary has-[:checked]:bg-primary-50"
              >
                <input
                  type="radio"
                  name="anpassung"
                  className="mt-0.5 accent-primary"
                  checked={anpassung === m.value}
                  onChange={() => setAnpassung(m.value)}
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>

          {anpassung === "staffel" ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Staffeln – Ausgangswert ist die Netto-Grundmiete. Zwischen den
                Staffeln muss mindestens ein Jahr liegen.
              </p>
              {staffeln.map((s, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label>Ab Datum</Label>
                    <Input
                      type="date"
                      value={s.ab}
                      onChange={(e) =>
                        setStaffeln((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, ab: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Label>Neue Netto-Grundmiete (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={s.miete}
                      onChange={(e) =>
                        setStaffeln((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, miete: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setStaffeln((prev) => prev.filter((_, j) => j !== i))
                    }
                    aria-label="Staffel entfernen"
                  >
                    <Trash2 className="size-4 text-danger-600" />
                  </Button>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setStaffeln((prev) => [...prev, { ab: "", miete: "" }])
                  }
                >
                  <Plus className="size-4" />
                  Staffel hinzufügen
                </Button>
              </div>
            </div>
          ) : null}

          {anpassung === "index" ? (
            <p className="text-sm text-muted-foreground">
              Die Grundmiete wird an den Verbraucherpreisindex des Statistischen
              Bundesamts (Basisjahr 2020 = 100) gekoppelt. Der Klauseltext wird
              automatisch eingefügt.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Kaution & Instandhaltung */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kaution">Kaution (€) – Ziffer 8</Label>
            <Input
              id="kaution"
              type="number"
              step="0.01"
              min="0"
              value={kaution}
              onChange={(e) => setKaution(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instEinzel">Instandhaltung je Einzelfall (€)</Label>
            <Input
              id="instEinzel"
              type="number"
              step="0.01"
              min="0"
              value={instandEinzelfall}
              onChange={(e) => setInstandEinzelfall(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instJahr">Instandhaltung je Jahr (€)</Label>
            <Input
              id="instJahr"
              type="number"
              step="0.01"
              min="0"
              value={instandJahr}
              onChange={(e) => setInstandJahr(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Außenreklame, Sachen, Wettbewerbsschutz */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reklame">Außenreklame-Flächen (Ziffer 14)</Label>
            <Textarea
              id="reklame"
              rows={2}
              value={aussenreklame}
              onChange={(e) => setAussenreklame(e.target.value)}
              placeholder="z. B. Schaufensterfront, Werbetafel über dem Eingang"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sachen">Ausgenommene Sachen (Ziffer 15, optional)</Label>
            <Textarea
              id="sachen"
              rows={2}
              value={ausgenommeneSachen}
              onChange={(e) => setAusgenommeneSachen(e.target.value)}
              placeholder="Sachen unter Eigentumsvorbehalt / geleast"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label>Wettbewerbsschutz (Ziffer 16)</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { v: "ausschliessen", label: "Keinen Konkurrenzschutz einräumen" },
                { v: "gewaehren", label: "Konkurrenzschutz gewähren" },
              ].map((o) => (
                <label
                  key={o.v}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-50"
                >
                  <input
                    type="radio"
                    name="wettbewerb"
                    className="accent-primary"
                    checked={wettbewerbsschutz === o.v}
                    onChange={() => setWettbewerbsschutz(o.v)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerichtsstand & Besondere Vereinbarungen */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gerichtsstand">Gerichtsstand (Ziffer 18)</Label>
            <Input
              id="gerichtsstand"
              value={gerichtsstand}
              onChange={(e) => setGerichtsstand(e.target.value)}
              placeholder="Ort des Objekts"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="besondere">Besondere Vereinbarungen (Ziffer 17)</Label>
            <Textarea
              id="besondere"
              rows={3}
              value={besondere}
              onChange={(e) => setBesondere(e.target.value)}
              placeholder="Optional – leer bleibt „Keine.“"
            />
          </div>
        </CardContent>
      </Card>

      {/* Anlagen */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-6">
          <h2 className="text-base font-semibold">Anlagen</h2>
          <p className="text-xs text-muted-foreground">
            Der Verweis auf ein Übergabeprotokoll ist bereits in Ziffer 1.3
            enthalten.
          </p>
          {ANLAGEN.map((a) => (
            <label
              key={a.key}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span>{a.label}</span>
              <Switch
                checked={anlagen[a.key]}
                onCheckedChange={(v) =>
                  setAnlagen((prev) => ({ ...prev, [a.key]: v }))
                }
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
            <SummaryRow label="Mieter" value={mieterFirma || "–"} />
            <SummaryRow label="Mietzweck" value={mietzweck || "–"} />
            <SummaryRow label="Mietsache" value={objektAdresse || "–"} />
            <SummaryRow
              label="Mietbeginn"
              value={mietbeginn ? formatDate(mietbeginn) : "–"}
            />
            <SummaryRow
              label="Laufzeit"
              value={`${laufzeitJahre || "–"} Jahre`}
            />
            <SummaryRow
              label="Netto-Grundmiete"
              value={formatCurrency(nettoNum)}
            />
            <SummaryRow
              label="Monatlich netto"
              value={formatCurrency(monatlichNetto)}
              bold
            />
            {ustOption ? (
              <SummaryRow label="inkl. USt (19 %)" value={formatCurrency(brutto)} />
            ) : null}
            <SummaryRow
              label="Mietanpassung"
              value={
                ANPASSUNG.find((m) => m.value === anpassung)?.label ?? anpassung
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Verschärfter Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-semibold">
            Gewerbemietrecht kennt kaum gesetzliche Schutzvorschriften – der
            Vertrag regelt fast alles abschließend.
          </span>{" "}
          Diese Vorlage ist eine Formulierungshilfe. Lass Gewerbemietverträge vor
          Abschluss unbedingt anwaltlich prüfen, insbesondere Laufzeit,
          Betriebskosten, Instandhaltung und Konkurrenzschutz.
        </span>
      </div>

      <div>
        <Button onClick={onGenerate} disabled={pending || !canGenerate}>
          {pending ? "PDF wird erzeugt …" : "Gewerbemietvertrag erzeugen"}
        </Button>
      </div>
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
        className={
          bold ? "font-semibold tabular-nums" : "tabular-nums text-right"
        }
      >
        {value}
      </span>
    </div>
  );
}
