"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Info } from "lucide-react";
import { toast } from "sonner";
import {
  calculateBilling,
  computeOccupancy,
  daysInclusive,
  type BillingInput,
  type AllocationKey,
  type Type35a,
} from "@repo/core";
import {
  loadWizardData,
  finalizeBilling,
  type WizardData,
  type PersonPeriod,
} from "../actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { COST_TYPE_LABELS, ALLOCATION_LABELS } from "@/app/belege/labels";
import { CreateRecordDialog } from "@/app/belege/CreateRecordDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { UMLAGEFAEHIGE_KOSTENARTEN } from "./costTypeInfo";
import { cn } from "@/lib/utils";

const STEPS = [
  "Objekt & Zeitraum",
  "Belege",
  "Heizkosten",
  "Mietzeiten & Personen",
  "Vorschau",
  "Abschluss",
];

const SELECT_CLS =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Property = { id: string; name: string };

function costLabel(key: string): string {
  return COST_TYPE_LABELS[key as keyof typeof COST_TYPE_LABELS] ?? key;
}

export function Wizard({
  properties,
  defaultObjekt,
}: {
  properties: Property[];
  defaultObjekt?: string;
}) {
  const router = useRouter();
  const lastYear = new Date().getFullYear() - 1;

  const [step, setStep] = useState(1);
  const [objektId, setObjektId] = useState(defaultObjekt ?? properties[0]?.id ?? "");
  const [von, setVon] = useState(`${lastYear}-01-01`);
  const [bis, setBis] = useState(`${lastYear}-12-31`);
  const [data, setData] = useState<WizardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [heating, setHeating] = useState<Record<string, string>>({});
  const [personPeriods, setPersonPeriods] = useState<
    Record<string, PersonPeriod[]>
  >({});
  const [finalizing, setFinalizing] = useState(false);

  async function onLoad() {
    if (!objektId || !von || !bis) {
      toast.error("Bitte Objekt und Zeitraum wählen.");
      return;
    }
    if (bis <= von) {
      toast.error("Das Ende muss nach dem Beginn liegen.");
      return;
    }
    setLoading(true);
    const res = await loadWizardData(objektId, von, bis);
    setLoading(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setData(res);
    setHeating(Object.fromEntries(res.tenancies.map((t) => [t.tenant_id, "0"])));
    setPersonPeriods(res.personPeriods);
    setStep(2);
  }

  async function reloadData() {
    if (!objektId || !von || !bis) return;
    const res = await loadWizardData(objektId, von, bis);
    if (!("error" in res)) setData(res);
  }

  const heatingNumbers = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(heating)) {
      const n = Number(String(v).replace(",", "."));
      out[k] = Number.isFinite(n) ? n : 0;
    }
    return out;
  }, [heating]);

  const preview = useMemo(() => {
    if (!data) return null;
    try {
      const input: BillingInput = {
        period_start: data.periodStart,
        period_end: data.periodEnd,
        units: data.units.map((u) => ({
          id: u.id,
          living_area: u.living_area,
          ownership_share: u.ownership_share,
        })),
        tenancies: data.tenancies.map((t) => ({
          tenant_id: t.tenant_id,
          unit_id: t.unit_id,
          move_in: t.move_in,
          move_out: t.move_out,
          persons_count: t.persons_count,
          person_periods: personPeriods[t.tenant_id],
        })),
        records: data.records.map((r) => ({
          id: r.id,
          cost_type: r.cost_type,
          allocation_key: r.allocation_key as AllocationKey,
          amount: r.amount,
          is_apportionable: r.is_apportionable,
          unit_id: r.unit_id,
          labor_cost_35a: r.labor_cost_35a,
          type_35a: r.type_35a as Type35a,
        })),
        heating: heatingNumbers,
        prepaymentsOperating: data.prepaymentsOperating,
        prepaymentsHeating: data.prepaymentsHeating,
      };
      return calculateBilling(input);
    } catch {
      return null;
    }
  }, [data, personPeriods, heatingNumbers]);

  const tenantName = (id: string) => {
    const t = data?.tenancies.find((x) => x.tenant_id === id);
    return t ? `${t.first_name} ${t.last_name}` : id;
  };

  async function onFinalize() {
    if (!data) return;
    setFinalizing(true);
    const res = await finalizeBilling({
      propertyId: objektId,
      periodStart: von,
      periodEnd: bis,
      heating: heatingNumbers,
      personPeriods,
    });
    if (res.error || !res.runId) {
      toast.error(res.error ?? "Erstellung fehlgeschlagen.");
      setFinalizing(false);
      return;
    }
    toast.success("Abrechnungen erstellt");
    router.push(`/abrechnung/${res.runId}`);
  }

  return (
    <div>
      {/* Fortschrittsleiste */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-primary-100 text-primary-700"
                      : "bg-neutral-100 text-neutral-400",
                )}
              >
                {n}
              </div>
              {i < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded",
                    done ? "bg-primary-200" : "bg-neutral-100",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">
        {STEPS[step - 1]}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Schritt {step} von {STEPS.length}
      </p>

      {step === 1 ? (
        <StepObjekt
          properties={properties}
          objektId={objektId}
          setObjektId={setObjektId}
          von={von}
          setVon={setVon}
          bis={bis}
          setBis={setBis}
          loading={loading}
          onLoad={onLoad}
          existingWarning={data?.existingFinalized ?? false}
        />
      ) : null}

      {step >= 2 && data ? (
        <div>
          {step === 2 ? (
            <StepBelege
              data={data}
              objektId={objektId}
              onRecordsChanged={reloadData}
            />
          ) : null}
          {step === 3 ? (
            <StepHeizkosten
              data={data}
              heating={heating}
              setHeating={setHeating}
            />
          ) : null}
          {step === 4 ? (
            <StepMietzeiten
              data={data}
              personPeriods={personPeriods}
              setPersonPeriods={setPersonPeriods}
            />
          ) : null}
          {step === 5 ? (
            preview ? (
              <StepVorschau
                data={data}
                preview={preview}
                tenantName={tenantName}
              />
            ) : (
              <PreviewError />
            )
          ) : null}
          {step === 6 ? (
            preview ? (
              <StepAbschluss
                preview={preview}
                onFinalize={onFinalize}
                finalizing={finalizing}
              />
            ) : (
              <PreviewError />
            )
          ) : null}

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Zurück
            </Button>
            {step < 6 ? (
              <Button onClick={() => setStep((s) => s + 1)}>Weiter</Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PreviewError() {
  return (
    <Card>
      <CardContent className="p-8 text-center text-sm text-muted-foreground">
        Die Vorschau konnte nicht berechnet werden. Bitte prüfe die Belege und
        Mietverhältnisse und gehe einen Schritt zurück.
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Schritt 1
// ---------------------------------------------------------------------------
function StepObjekt(props: {
  properties: Property[];
  objektId: string;
  setObjektId: (v: string) => void;
  von: string;
  setVon: (v: string) => void;
  bis: string;
  setBis: (v: string) => void;
  loading: boolean;
  onLoad: () => void;
  existingWarning: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="w-objekt">Objekt</Label>
          <select
            id="w-objekt"
            value={props.objektId}
            onChange={(e) => props.setObjektId(e.target.value)}
            className={SELECT_CLS}
          >
            {props.properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="w-von">Zeitraum von</Label>
            <Input
              id="w-von"
              type="date"
              value={props.von}
              onChange={(e) => props.setVon(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="w-bis">Zeitraum bis</Label>
            <Input
              id="w-bis"
              type="date"
              value={props.bis}
              onChange={(e) => props.setBis(e.target.value)}
            />
          </div>
        </div>
        {props.existingWarning ? (
          <div className="rounded-lg border border-warning-100 bg-warning-50 px-3 py-2 text-sm text-warning-700">
            Für dieses Objekt und diesen Zeitraum existiert bereits ein
            finalisierter Abrechnungslauf. Ein erneuter Lauf erzeugt zusätzliche
            Abrechnungen.
          </div>
        ) : null}
        <div>
          <Button onClick={props.onLoad} disabled={props.loading}>
            {props.loading ? "Wird geladen …" : "Weiter"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Schritt 2 – Belege
// ---------------------------------------------------------------------------
function StepBelege({
  data,
  objektId,
  onRecordsChanged,
}: {
  data: WizardData;
  objektId: string;
  onRecordsChanged: () => void;
}) {
  const [ctOpen, setCtOpen] = useState(false);
  const [selectedCt, setSelectedCt] = useState<string | undefined>(undefined);

  const groups = useMemo(() => {
    const map = new Map<string, WizardData["records"]>();
    for (const r of data.records) {
      const list = map.get(r.cost_type) ?? [];
      list.push(r);
      map.set(r.cost_type, list);
    }
    return [...map.entries()];
  }, [data.records]);

  const presentTypes = useMemo(
    () => new Set(data.records.map((r) => r.cost_type)),
    [data.records],
  );
  const year = data.periodStart.slice(0, 4);
  const propertyOptions = [{ id: data.property.id, name: data.property.name }];

  function openForCostType(key: string) {
    setSelectedCt(key);
    setCtOpen(true);
  }

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Belegliste */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Alle Belege mit Überschneidung zum Zeitraum, gruppiert nach
              Kostenart.
            </p>
            <div className="flex gap-2">
              <CreateRecordDialog
                properties={propertyOptions}
                defaultPropertyId={objektId}
                onCreated={onRecordsChanged}
              />
              <Button asChild variant="outline">
                <Link href={`/belege?objekt=${objektId}`}>Belege verwalten</Link>
              </Button>
            </div>
          </div>

          {data.records.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-muted-foreground">
              Für diesen Zeitraum sind noch keine Belege erfasst.
            </div>
          ) : (
            groups.map(([type, recs]) => (
              <Card key={type}>
                <CardContent className="p-4">
                  <div className="mb-2 font-semibold">{costLabel(type)}</div>
                  <div className="flex flex-col gap-1.5">
                    {recs.map((r) => {
                      const directNoUnit =
                        r.allocation_key === "direct" && !r.unit_id;
                      return (
                        <div
                          key={r.id}
                          className={cn(
                            "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm",
                            r.is_apportionable
                              ? "border-neutral-200"
                              : "border-neutral-200 bg-neutral-50 text-neutral-400",
                          )}
                        >
                          <span>
                            {formatCurrency(r.amount)} ·{" "}
                            {ALLOCATION_LABELS[
                              r.allocation_key as keyof typeof ALLOCATION_LABELS
                            ] ?? r.allocation_key}
                          </span>
                          <span className="flex items-center gap-2">
                            {!r.is_apportionable ? (
                              <Badge variant="neutral">nicht umlagefähig</Badge>
                            ) : null}
                            {directNoUnit ? (
                              <Badge variant="warning">
                                Direktzuordnung ohne Einheit
                              </Badge>
                            ) : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Kostenarten-Checkliste */}
        <div className="lg:w-80 lg:shrink-0">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 font-semibold">Kostenarten {year}</div>
              <ul className="flex flex-col gap-0.5">
                {UMLAGEFAEHIGE_KOSTENARTEN.map((ct) => {
                  const checked = presentTypes.has(ct.key);
                  return (
                    <li key={ct.key} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!checked) openForCostType(ct.key);
                        }}
                        disabled={checked}
                        className={cn(
                          "flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                          checked
                            ? "text-neutral-400"
                            : "hover:bg-neutral-50",
                        )}
                      >
                        {checked ? (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                            <Check className="size-3.5" />
                          </span>
                        ) : (
                          <span className="size-5 shrink-0 rounded-full border border-neutral-300" />
                        )}
                        <span className={cn(checked && "line-through")}>
                          {ct.label}
                        </span>
                      </button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Info zu ${ct.label}`}
                            className="flex size-6 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                          >
                            <Info className="size-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end">
                          <div className="mb-1 font-semibold text-foreground">
                            {ct.label}
                          </div>
                          <p className="text-muted-foreground">{ct.info}</p>
                        </PopoverContent>
                      </Popover>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 border-t border-neutral-100 pt-3 text-xs text-muted-foreground">
                Nicht jede Kostenart fällt in jedem Objekt an – die Liste ist eine
                Gedankenstütze, keine Pflicht.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {data.records.length === 0 ? (
        <div className="mt-6 rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          Ohne Belege wird eine leere Abrechnung erstellt.
        </div>
      ) : null}

      {/* Beleg-Dialog mit vorausgewählter Kostenart (Checklisten-Klick) */}
      <CreateRecordDialog
        key={selectedCt ?? "none"}
        properties={propertyOptions}
        defaultPropertyId={objektId}
        defaultCostType={selectedCt}
        onCreated={onRecordsChanged}
        open={ctOpen}
        onOpenChange={setCtOpen}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schritt 3 – Heizkosten
// ---------------------------------------------------------------------------
function StepHeizkosten({
  data,
  heating,
  setHeating,
}: {
  data: WizardData;
  heating: Record<string, string>;
  setHeating: (v: Record<string, string>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-secondary-100 bg-secondary-50 px-4 py-3 text-sm text-secondary-800">
        Werte aus der Abrechnung Ihres Messdienstleisters (z. B. ista/Techem)
        gemäß Heizkostenverordnung. 0 € ist erlaubt.
      </div>
      {data.tenancies.map((t) => (
        <Card key={t.tenant_id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="font-medium">
                {t.first_name} {t.last_name}
              </div>
              <div className="text-sm text-muted-foreground">
                Einheit {t.unit_label}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`heat-${t.tenant_id}`} className="text-sm">
                Heizkosten (€)
              </Label>
              <Input
                id={`heat-${t.tenant_id}`}
                type="number"
                min="0"
                step="0.01"
                className="w-32"
                value={heating[t.tenant_id] ?? "0"}
                onChange={(e) =>
                  setHeating({ ...heating, [t.tenant_id]: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schritt 4 – Mietzeiten & Personen
// ---------------------------------------------------------------------------
function StepMietzeiten({
  data,
  personPeriods,
  setPersonPeriods,
}: {
  data: WizardData;
  personPeriods: Record<string, PersonPeriod[]>;
  setPersonPeriods: (v: Record<string, PersonPeriod[]>) => void;
}) {
  const periodDays = daysInclusive(data.periodStart, data.periodEnd);

  // Leerstand je Einheit
  const vacancyByUnit = new Map<string, number>();
  for (const u of data.units) {
    const occ = data.tenancies
      .filter((t) => t.unit_id === u.id)
      .reduce(
        (s, t) =>
          s +
          computeOccupancy(
            {
              tenant_id: t.tenant_id,
              unit_id: t.unit_id,
              move_in: t.move_in,
              move_out: t.move_out,
              persons_count: t.persons_count,
            },
            data.periodStart,
            data.periodEnd,
          ).occDays,
        0,
      );
    vacancyByUnit.set(u.id, Math.max(0, periodDays - occ));
  }

  function addPeriod(tid: string) {
    const list = personPeriods[tid] ?? [];
    setPersonPeriods({
      ...personPeriods,
      [tid]: [
        ...list,
        { from: data.periodStart, to: data.periodEnd, persons: 1 },
      ],
    });
  }
  function updatePeriod(tid: string, i: number, patch: Partial<PersonPeriod>) {
    const list = [...(personPeriods[tid] ?? [])];
    const current = list[i];
    if (!current) return;
    list[i] = { ...current, ...patch };
    setPersonPeriods({ ...personPeriods, [tid]: list });
  }
  function removePeriod(tid: string, i: number) {
    const list = [...(personPeriods[tid] ?? [])];
    list.splice(i, 1);
    setPersonPeriods({ ...personPeriods, [tid]: list });
  }

  return (
    <div className="flex flex-col gap-4">
      {data.units.map((u) => {
        const vac = vacancyByUnit.get(u.id) ?? 0;
        return vac > 0 ? (
          <div
            key={`vac-${u.id}`}
            className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-2 text-sm text-warning-700"
          >
            Einheit {u.label}: {vac} Leerstandstage im Zeitraum.
          </div>
        ) : null;
      })}

      {data.tenancies.map((t) => {
        const occ = computeOccupancy(
          {
            tenant_id: t.tenant_id,
            unit_id: t.unit_id,
            move_in: t.move_in,
            move_out: t.move_out,
            persons_count: t.persons_count,
            person_periods: personPeriods[t.tenant_id],
          },
          data.periodStart,
          data.periodEnd,
        );
        const periods = personPeriods[t.tenant_id] ?? [];
        return (
          <Card key={t.tenant_id}>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">
                  {t.first_name} {t.last_name}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    · Einheit {t.unit_label}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(occ.occFrom)} – {formatDate(occ.occTo)} ·{" "}
                  {occ.occDays} Tage · {occ.personDays} Personentage
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {periods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Standard: {t.persons_count}{" "}
                    {t.persons_count === 1 ? "Person" : "Personen"} für den
                    gesamten Belegungszeitraum.
                  </p>
                ) : (
                  periods.map((p, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="date"
                        value={p.from}
                        onChange={(e) =>
                          updatePeriod(t.tenant_id, i, { from: e.target.value })
                        }
                        className="w-40"
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        type="date"
                        value={p.to}
                        onChange={(e) =>
                          updatePeriod(t.tenant_id, i, { to: e.target.value })
                        }
                        className="w-40"
                      />
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={p.persons}
                        onChange={(e) =>
                          updatePeriod(t.tenant_id, i, {
                            persons: Number(e.target.value),
                          })
                        }
                        className="w-24"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePeriod(t.tenant_id, i)}
                      >
                        Entfernen
                      </Button>
                    </div>
                  ))
                )}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPeriod(t.tenant_id)}
                  >
                    Personen-Zeitraum hinzufügen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schritt 5 – Vorschau
// ---------------------------------------------------------------------------
function StepVorschau({
  data,
  preview,
  tenantName,
}: {
  data: WizardData;
  preview: ReturnType<typeof calculateBilling>;
  tenantName: (id: string) => string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {preview.statements.map((st) => (
        <details key={st.tenant_id} className="rounded-xl border border-neutral-200 bg-white">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3">
            <span className="font-semibold">{tenantName(st.tenant_id)}</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                st.balance > 0 ? "text-danger-600" : "text-success-700",
              )}
            >
              {st.balance > 0 ? "Nachzahlung " : "Guthaben "}
              {formatCurrency(Math.abs(st.balance))}
            </span>
          </summary>
          <div className="border-t border-neutral-100 p-4 text-sm">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-1">Kostenart</th>
                  <th className="pb-1 text-right">Gesamt</th>
                  <th className="pb-1">Schlüssel</th>
                  <th className="pb-1 text-right">Anteil</th>
                </tr>
              </thead>
              <tbody>
                {st.positions.map((p, i) => (
                  <tr key={i}>
                    <td>{costLabel(p.cost_type)}</td>
                    <td className="text-right tabular-nums">
                      {formatCurrency(p.total_cost)}
                    </td>
                    <td>
                      {ALLOCATION_LABELS[
                        p.allocation_key as keyof typeof ALLOCATION_LABELS
                      ] ?? p.allocation_key}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatCurrency(p.share)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>Heizkosten</td>
                  <td />
                  <td>Verbrauch</td>
                  <td className="text-right tabular-nums">
                    {formatCurrency(st.heating_costs)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3 flex flex-col gap-1 border-t border-neutral-100 pt-2">
              <Row label="Zwischensumme" value={st.total_share + st.heating_costs} />
              <Row
                label="Vorauszahlungen"
                value={-(st.prepayments_operating + st.prepayments_heating)}
              />
              <div className="flex justify-between font-bold">
                <span>{st.balance > 0 ? "Nachzahlung" : "Guthaben"}</span>
                <span className="tabular-nums">
                  {formatCurrency(Math.abs(st.balance))}
                </span>
              </div>
              {st.labor_35a_household + st.labor_35a_craftsman > 0 ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  § 35a: haushaltsnah {formatCurrency(st.labor_35a_household)} ·
                  Handwerker {formatCurrency(st.labor_35a_craftsman)}
                </div>
              ) : null}
            </div>
          </div>
        </details>
      ))}

      <Card>
        <CardContent className="p-4">
          <div className="font-semibold">
            Eigentümeranteil (Leerstand + nicht umlagefähig)
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {formatCurrency(preview.owner.total_share)} verbleiben beim
            Eigentümer. Zeitraum: {formatDate(data.periodStart)} –{" "}
            {formatDate(data.periodEnd)}.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schritt 6 – Abschluss
// ---------------------------------------------------------------------------
function StepAbschluss({
  preview,
  onFinalize,
  finalizing,
}: {
  preview: ReturnType<typeof calculateBilling>;
  onFinalize: () => void;
  finalizing: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <p className="text-sm text-muted-foreground">
          Es werden {preview.statements.length}{" "}
          {preview.statements.length === 1 ? "Abrechnung" : "Abrechnungen"}{" "}
          erstellt. Für jeden Mieter wird ein PDF erzeugt und gespeichert. Der
          Lauf wird als finalisiert gespeichert.
        </p>
        <div>
          <Button onClick={onFinalize} disabled={finalizing}>
            {finalizing ? "Wird erstellt …" : "Abrechnungen erstellen"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
