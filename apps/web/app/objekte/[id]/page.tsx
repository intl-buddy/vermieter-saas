import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@repo/core";
import { createClient } from "../../../lib/supabase/server";
import { formatCurrency, formatDate } from "../../../lib/format";
import { SiteHeader } from "../../components/SiteHeader";
import { PropertyForm } from "../PropertyForm";
import { UnitForm } from "./UnitForm";
import { TenantForm } from "./TenantForm";
import styles from "../objekte.module.css";

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

  // Aktive Mietverhältnisse (move_out_date IS NULL) je Einheit separat laden
  // und im Speicher zuordnen – vermeidet Mehrdeutigkeiten beim Embedded-Filter.
  const unitIds = (units ?? []).map((unit) => unit.id);
  const activeTenantByUnit = new Map<
    string,
    {
      id: string;
      first_name: string;
      last_name: string;
      email: string | null;
      phone: string | null;
      persons_count: number;
      move_in_date: string;
      cold_rent: number;
      operating_costs_advance: number;
      heating_costs_advance: number;
      rent_due_day: number;
      deposit_type: DepositType;
      deposit_amount: number;
    }
  >();

  if (unitIds.length > 0) {
    const { data: tenants } = await supabase
      .from("tenants")
      .select(
        "id, unit_id, first_name, last_name, email, phone, persons_count, move_in_date, cold_rent, operating_costs_advance, heating_costs_advance, rent_due_day, deposit_type, deposit_amount",
      )
      .in("unit_id", unitIds)
      .is("move_out_date", null);

    for (const tenant of tenants ?? []) {
      activeTenantByUnit.set(tenant.unit_id, tenant);
    }
  }

  return (
    <div className={styles.container}>
      <SiteHeader />

      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href="/objekte" className={styles.backLink}>
            ← Zurück zur Objektliste
          </Link>
        </div>

        <h1 className={styles.title}>{property.name}</h1>
        <p className={styles.metaLine}>
          {property.street} {property.house_number}, {property.zip}{" "}
          {property.city}
        </p>
        <p className={styles.metaLine}>
          Baujahr: {property.build_year ?? "–"} · Wohnfläche gesamt:{" "}
          {area(property.total_living_area)}
        </p>

        <details className={styles.disclosure} style={{ marginTop: 20 }}>
          <summary className={styles.disclosureSummary}>
            Objekt bearbeiten
          </summary>
          <div className={styles.disclosureBody}>
            <PropertyForm mode="edit" property={property} />
          </div>
        </details>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Einheiten</h2>

          <details className={styles.disclosure}>
            <summary className={styles.disclosureSummary}>
              + Neue Einheit anlegen
            </summary>
            <div className={styles.disclosureBody}>
              <UnitForm mode="create" propertyId={property.id} />
            </div>
          </details>

          {unitsError ? (
            <div className={styles.error}>
              Die Einheiten konnten nicht geladen werden: {unitsError.message}
            </div>
          ) : !units || units.length === 0 ? (
            <div className={styles.empty}>
              Noch keine Einheiten. Lege oben die erste Einheit an.
            </div>
          ) : (
            <div className={styles.unitList}>
              {units.map((unit) => {
                const tenant = activeTenantByUnit.get(unit.id);
                return (
                  <div key={unit.id} className={styles.unitCard}>
                    <div className={styles.unitHeader}>
                      <div>
                        <h3 className={styles.unitTitle}>
                          {unit.label}
                          <span className={styles.badge} style={{ marginLeft: 8 }}>
                            {UNIT_TYPE_LABELS[unit.unit_type]}
                          </span>
                        </h3>
                        <p className={styles.unitMeta}>
                          Etage: {unit.floor || "–"} · Fläche:{" "}
                          {area(unit.living_area)} · Zimmer:{" "}
                          {unit.rooms ?? "–"}
                        </p>
                      </div>
                    </div>

                    <div className={styles.unitBody}>
                      {tenant ? (
                        <div className={styles.tenantBox}>
                          <p className={styles.tenantName}>
                            {tenant.first_name} {tenant.last_name}
                            <span className={styles.activeTag}>
                              Aktives Mietverhältnis
                            </span>
                          </p>
                          <dl className={styles.tenantGrid}>
                            <div>
                              <dt>Einzug</dt>
                              <dd>{formatDate(tenant.move_in_date)}</dd>
                            </div>
                            <div>
                              <dt>Kaltmiete</dt>
                              <dd>{formatCurrency(tenant.cold_rent)}</dd>
                            </div>
                            <div>
                              <dt>NK-Vorauszahlung</dt>
                              <dd>
                                {formatCurrency(tenant.operating_costs_advance)}
                              </dd>
                            </div>
                            <div>
                              <dt>Heizkosten-VZ</dt>
                              <dd>
                                {formatCurrency(tenant.heating_costs_advance)}
                              </dd>
                            </div>
                            <div>
                              <dt>Fälligkeitstag</dt>
                              <dd>{tenant.rent_due_day}.</dd>
                            </div>
                            <div>
                              <dt>Personen</dt>
                              <dd>{tenant.persons_count}</dd>
                            </div>
                            <div>
                              <dt>Kaution</dt>
                              <dd>
                                {formatCurrency(tenant.deposit_amount)} (
                                {DEPOSIT_TYPE_LABELS[tenant.deposit_type]})
                              </dd>
                            </div>
                            <div>
                              <dt>Kontakt</dt>
                              <dd>{tenant.email || tenant.phone || "–"}</dd>
                            </div>
                          </dl>
                        </div>
                      ) : (
                        <details className={styles.subDisclosure}>
                          <summary className={styles.disclosureSummary}>
                            + Mieter anlegen
                          </summary>
                          <div className={styles.disclosureBody}>
                            <TenantForm
                              unitId={unit.id}
                              propertyId={property.id}
                            />
                          </div>
                        </details>
                      )}

                      <details className={styles.subDisclosure}>
                        <summary className={styles.disclosureSummary}>
                          Einheit bearbeiten
                        </summary>
                        <div className={styles.disclosureBody}>
                          <UnitForm
                            mode="edit"
                            propertyId={property.id}
                            unit={unit}
                          />
                        </div>
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
