import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Receipt } from "lucide-react";
import type { Database } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PropertyForm } from "../PropertyForm";
import { UnitForm } from "./UnitForm";
import { TenantForm } from "./TenantForm";
import { TenantActions } from "./TenantActions";
import type { TenantValues } from "./TenantEditDialog";

type UnitType = Database["public"]["Enums"]["unit_type"];
type DepositType = Database["public"]["Enums"]["deposit_type"];

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  residential: "Wohnung",
  commercial: "Gewerbe",
  parking: "Stellplatz",
  other: "Sonstiges",
};

const DEPOSIT_TYPE_LABELS: Record<DepositType, string> = {
  cash_deposit: "Barkaution",
  bank_guarantee: "Bankbürgschaft",
  deposit_insurance: "Kautionsversicherung",
  pledged_savings: "Verpfändetes Sparbuch",
  none: "Keine",
};

/** Formatiert eine optionale m²-Angabe. */
function area(value: number | null): string {
  return value == null ? "–" : `${value.toLocaleString("de-DE")} m²`;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export default async function ObjektDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zusätzliche Absicherung zur Middleware.
  if (!user) {
    redirect("/login");
  }

  const { data: property } = await supabase
    .from("properties")
    .select(
      "id, name, street, house_number, zip, city, build_year, total_living_area, notes",
    )
    .eq("id", id)
    .maybeSingle();

  if (!property) {
    notFound();
  }

  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("id, label, unit_type, floor, living_area, rooms, notes")
    .eq("property_id", id)
    .order("label", { ascending: true });

  // Belege dieses Objekts im laufenden Kalenderjahr (nur Anzahl)
  const belegeYear = new Date().getFullYear();
  const { count: belegeCount } = await supabase
    .from("operating_costs_records")
    .select("id", { count: "exact", head: true })
    .eq("property_id", id)
    .gte("invoice_date", `${belegeYear}-01-01`)
    .lte("invoice_date", `${belegeYear}-12-31`);

  // Alle Mietverhältnisse (aktiv + beendet) je Einheit laden und im Speicher
  // aufteilen. Aktiv = move_out_date IS NULL.
  const unitIds = (units ?? []).map((unit) => unit.id);
  const activeTenantByUnit = new Map<string, TenantValues & { unit_id: string }>();
  const endedByUnit = new Map<
    string,
    {
      id: string;
      first_name: string;
      last_name: string;
      move_in_date: string;
      move_out_date: string;
    }[]
  >();

  if (unitIds.length > 0) {
    const { data: tenants } = await supabase
      .from("tenants")
      .select(
        "id, unit_id, first_name, last_name, email, phone, persons_count, move_in_date, move_out_date, cold_rent, operating_costs_advance, heating_costs_advance, rent_due_day, deposit_type, deposit_amount, deposit_paid, iban, notes",
      )
      .in("unit_id", unitIds)
      .order("move_out_date", { ascending: false });

    for (const t of tenants ?? []) {
      if (t.move_out_date === null) {
        activeTenantByUnit.set(t.unit_id, {
          id: t.id,
          unit_id: t.unit_id,
          first_name: t.first_name,
          last_name: t.last_name,
          email: t.email,
          phone: t.phone,
          persons_count: t.persons_count,
          move_in_date: t.move_in_date,
          cold_rent: t.cold_rent,
          operating_costs_advance: t.operating_costs_advance,
          heating_costs_advance: t.heating_costs_advance,
          rent_due_day: t.rent_due_day,
          deposit_type: t.deposit_type,
          deposit_amount: t.deposit_amount,
          deposit_paid: t.deposit_paid,
          iban: t.iban,
          notes: t.notes,
        });
      } else {
        const list = endedByUnit.get(t.unit_id) ?? [];
        list.push({
          id: t.id,
          first_name: t.first_name,
          last_name: t.last_name,
          move_in_date: t.move_in_date,
          move_out_date: t.move_out_date,
        });
        endedByUnit.set(t.unit_id, list);
      }
    }
  }

  return (
    <AppShell title={property.name} userEmail={user.email ?? ""}>
      <div className="mb-4">
        <Link
          href="/objekte"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Zurück zur Objektliste
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {property.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {property.street} {property.house_number}, {property.zip}{" "}
          {property.city}
        </p>
        <p className="text-sm text-muted-foreground">
          Baujahr: {property.build_year ?? "–"} · Wohnfläche gesamt:{" "}
          {area(property.total_living_area)}
        </p>
      </div>

      <details className="mb-8 rounded-xl border border-neutral-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-primary marker:hidden hover:text-primary-600">
          Objekt bearbeiten
        </summary>
        <div className="border-t border-neutral-100 p-4">
          <PropertyForm mode="edit" property={property} />
        </div>
      </details>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Einheiten</h2>

        <details className="mb-4 rounded-xl border border-neutral-200 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-primary marker:hidden hover:text-primary-600">
            + Neue Einheit anlegen
          </summary>
          <div className="border-t border-neutral-100 p-4">
            <UnitForm mode="create" propertyId={property.id} />
          </div>
        </details>

        {unitsError ? (
          <Card>
            <CardContent className="p-6 text-sm text-danger-700">
              Die Einheiten konnten nicht geladen werden: {unitsError.message}
            </CardContent>
          </Card>
        ) : !units || units.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-1 p-10 text-center">
              <p className="text-base font-medium">
                Noch keine Einheiten – lege die erste an
              </p>
              <p className="text-sm text-muted-foreground">
                Nutze „+ Neue Einheit anlegen" oben.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {units.map((unit) => {
              const tenant = activeTenantByUnit.get(unit.id);
              return (
                <Card key={unit.id}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{unit.label}</h3>
                      <Badge variant="neutral">
                        {UNIT_TYPE_LABELS[unit.unit_type]}
                      </Badge>
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Etage: {unit.floor || "–"} · Fläche: {area(unit.living_area)}{" "}
                      · Zimmer: {unit.rooms ?? "–"}
                    </p>

                    {tenant ? (
                      <div className="rounded-xl border border-secondary-100 bg-secondary-50/50 p-4">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <p className="flex flex-wrap items-center gap-2 font-semibold">
                            {tenant.first_name} {tenant.last_name}
                            <Badge variant="success">Aktives Mietverhältnis</Badge>
                          </p>
                          <TenantActions
                            tenant={tenant}
                            propertyId={property.id}
                          />
                        </div>
                        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <InfoItem
                            label="Einzug"
                            value={formatDate(tenant.move_in_date)}
                          />
                          <InfoItem
                            label="Kaltmiete"
                            value={formatCurrency(tenant.cold_rent)}
                          />
                          <InfoItem
                            label="NK-Vorauszahlung"
                            value={formatCurrency(tenant.operating_costs_advance)}
                          />
                          <InfoItem
                            label="Heizkosten-VZ"
                            value={formatCurrency(tenant.heating_costs_advance)}
                          />
                          <InfoItem
                            label="Fälligkeitstag"
                            value={`${tenant.rent_due_day}.`}
                          />
                          <InfoItem
                            label="Personen"
                            value={tenant.persons_count}
                          />
                          <InfoItem
                            label="Kaution"
                            value={`${formatCurrency(tenant.deposit_amount)} (${DEPOSIT_TYPE_LABELS[tenant.deposit_type as DepositType]})`}
                          />
                          <InfoItem
                            label="Kontakt"
                            value={tenant.email || tenant.phone || "–"}
                          />
                        </dl>
                      </div>
                    ) : (
                      <details className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
                        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-primary marker:hidden hover:text-primary-600">
                          + Mieter anlegen
                        </summary>
                        <div className="border-t border-neutral-200 bg-white p-4">
                          <TenantForm unitId={unit.id} propertyId={property.id} />
                        </div>
                      </details>
                    )}

                    {(endedByUnit.get(unit.id)?.length ?? 0) > 0 ? (
                      <details className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50">
                        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-neutral-600 marker:hidden hover:text-neutral-800">
                          Frühere Mietverhältnisse (
                          {endedByUnit.get(unit.id)!.length})
                        </summary>
                        <div className="flex flex-col gap-2 border-t border-neutral-200 bg-white p-4">
                          {endedByUnit.get(unit.id)!.map((e) => (
                            <div
                              key={e.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
                            >
                              <span className="font-medium">
                                {e.first_name} {e.last_name}
                              </span>
                              <span className="flex flex-wrap items-center gap-2">
                                <span>
                                  {formatDate(e.move_in_date)} –{" "}
                                  {formatDate(e.move_out_date)}
                                </span>
                                <Badge variant="neutral">
                                  Beendet zum {formatDate(e.move_out_date)}
                                </Badge>
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}

                    <details className="mt-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
                      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-primary marker:hidden hover:text-primary-600">
                        Einheit bearbeiten
                      </summary>
                      <div className="border-t border-neutral-200 bg-white p-4">
                        <UnitForm
                          mode="edit"
                          propertyId={property.id}
                          unit={unit}
                        />
                      </div>
                    </details>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Nebenkostenabrechnung</h2>
          <Button asChild>
            <Link href={`/abrechnung/neu?objekt=${property.id}`}>
              Nebenkostenabrechnung erstellen
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Erstelle eine tagesgenaue Betriebskostenabrechnung für dieses Objekt –
            Schritt für Schritt inkl. Heizkosten, Personen und § 35a-Ausweis.
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Belege</h2>
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <Receipt className="size-5" />
              </span>
              <div>
                <div className="font-semibold">
                  {belegeCount ?? 0} Belege in {belegeYear}
                </div>
                <div className="text-sm text-muted-foreground">
                  Betriebskosten-Belege dieses Objekts
                </div>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href={`/belege?objekt=${property.id}`}>
                Belege ansehen
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
