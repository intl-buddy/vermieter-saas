// ============================================================================
// Schema-Wächter – erwartete Spalten der Datenbank (framework-frei, testbar).
//
// Zweck: Schema-Drift früh erkennen. Wird eine Migration deployed, aber im
// Supabase SQL Editor vergessen, laufen Build und Start fehlerfrei durch – die
// Fehler tauchen erst später als kryptische PostgREST-Meldungen im Nutzerpfad
// auf. `/api/health` prüft diese Liste gegen information_schema und meldet
// „degraded" statt zu schweigen.
//
// WICHTIG: Jede neue Migration ergänzt diese Liste (siehe CLAUDE.md).
// ============================================================================

/** Eine erwartete Spalte inkl. der Migration, die sie eingeführt hat. */
export interface ExpectedColumn {
  /** Tabellenname im Schema `public`. */
  table: string;
  /** Spaltenname. */
  column: string;
  /** Migrationsdatei, die die Spalte anlegt – erscheint in der Warnung. */
  since: string;
}

/**
 * Spalten, auf die sich der Code verlässt. Bewusst keine vollständige
 * Schema-Kopie: Nur was der Code tatsächlich liest oder schreibt, damit die
 * Liste wartbar bleibt und der Wächter aussagekräftig ist.
 */
export const EXPECTED_COLUMNS: ExpectedColumn[] = [
  // --- 001: Abo-Basisfelder auf users -------------------------------------
  { table: "users", column: "plan", since: "001_initial_schema.sql" },
  {
    table: "users",
    column: "subscription_status",
    since: "001_initial_schema.sql",
  },
  { table: "users", column: "trial_ends_at", since: "001_initial_schema.sql" },
  {
    table: "users",
    column: "stripe_customer_id",
    since: "001_initial_schema.sql",
  },

  // --- 006: Nebenkostenabrechnung (Wizard) --------------------------------
  {
    table: "operating_costs_records",
    column: "labor_cost_35a",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "operating_costs_records",
    column: "type_35a",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "tenant_person_periods",
    column: "persons_count",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "tenant_person_periods",
    column: "valid_from",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "tenant_person_periods",
    column: "valid_to",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_runs",
    column: "tenant_count",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_runs",
    column: "total_costs",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_runs",
    column: "status",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_statements",
    column: "labor_35a_household",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_statements",
    column: "labor_35a_craftsman",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_statements",
    column: "total_share",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_statements",
    column: "heating_costs",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_statements",
    column: "prepayments_operating",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_statements",
    column: "prepayments_heating",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_statements",
    column: "balance",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_statements",
    column: "line_items",
    since: "006_nebenkostenabrechnung.sql",
  },
  {
    table: "billing_statements",
    column: "pdf_url",
    since: "006_nebenkostenabrechnung.sql",
  },

  // --- 007: Vorauszahlungs-Modus & Herkunft -------------------------------
  { table: "tenants", column: "advance_mode", since: "007_advance_mode.sql" },
  {
    table: "billing_statements",
    column: "prepayments_source",
    since: "007_advance_mode.sql",
  },

  // --- 008: Belegungszeitraum je Statement --------------------------------
  {
    table: "billing_statements",
    column: "occupancy_start",
    since: "008_billing_statements_cleanup.sql",
  },
  {
    table: "billing_statements",
    column: "occupancy_end",
    since: "008_billing_statements_cleanup.sql",
  },
  {
    table: "billing_statements",
    column: "occupancy_days",
    since: "008_billing_statements_cleanup.sql",
  },

  // --- 009: Stripe-Abo-Felder ---------------------------------------------
  {
    table: "users",
    column: "subscription_id",
    since: "009_stripe_subscriptions.sql",
  },
  { table: "users", column: "price_id", since: "009_stripe_subscriptions.sql" },
  {
    table: "users",
    column: "current_period_end",
    since: "009_stripe_subscriptions.sql",
  },
  {
    table: "users",
    column: "cancel_at_period_end",
    since: "009_stripe_subscriptions.sql",
  },

  // --- 010: Lebenszyklus (Lesemodus, Löschung) ----------------------------
  {
    table: "users",
    column: "access_until",
    since: "010_lifecycle_readonly_deletion.sql",
  },
  {
    table: "users",
    column: "deletion_warned_at",
    since: "010_lifecycle_readonly_deletion.sql",
  },
  {
    table: "users",
    column: "deleted_at",
    since: "010_lifecycle_readonly_deletion.sql",
  },
  {
    table: "deletion_log",
    column: "user_id_hash",
    since: "010_lifecycle_readonly_deletion.sql",
  },
  {
    table: "deletion_log",
    column: "deleted_at",
    since: "010_lifecycle_readonly_deletion.sql",
  },

  // --- 011: keine neuen Spalten (nur Defaults/Trigger/Backfill) -----------

  // --- 012: keine neuen Spalten (nur Schema-Wächter-RPC) ------------------

  // --- 013: Onboarding ----------------------------------------------------
  {
    table: "users",
    column: "onboarding_completed",
    since: "013_onboarding.sql",
  },

  // --- 014: Wohnungsübergabeprotokoll -------------------------------------
  {
    table: "handover_protocols",
    column: "unit_id",
    since: "014_handover_protocols.sql",
  },
  {
    table: "handover_protocols",
    column: "type",
    since: "014_handover_protocols.sql",
  },
  {
    table: "handover_protocols",
    column: "status",
    since: "014_handover_protocols.sql",
  },
  {
    table: "handover_protocols",
    column: "rooms",
    since: "014_handover_protocols.sql",
  },
  {
    table: "handover_protocols",
    column: "meter_readings",
    since: "014_handover_protocols.sql",
  },
  {
    table: "handover_protocols",
    column: "keys",
    since: "014_handover_protocols.sql",
  },
  {
    table: "handover_protocols",
    column: "signature_landlord",
    since: "014_handover_protocols.sql",
  },
  {
    table: "handover_protocols",
    column: "pdf_url",
    since: "014_handover_protocols.sql",
  },

  // --- 015: Admin-Dashboard -----------------------------------------------
  {
    table: "users",
    column: "is_admin",
    since: "015_admin_dashboard.sql",
  },

  // --- 016: Umsatz (nur Funktion, keine Spalten) --------------------------

  // --- 017: Admin-Analytics -----------------------------------------------
  {
    table: "admin_metrics_snapshots",
    column: "snapshot_date",
    since: "017_admin_analytics.sql",
  },
  {
    table: "admin_metrics_snapshots",
    column: "mrr_gross",
    since: "017_admin_analytics.sql",
  },
  {
    table: "admin_metrics_snapshots",
    column: "users_total",
    since: "017_admin_analytics.sql",
  },
  {
    table: "admin_metrics_snapshots",
    column: "protocols_total",
    since: "017_admin_analytics.sql",
  },
  {
    table: "admin_price_catalog",
    column: "price_id",
    since: "017_admin_analytics.sql",
  },
  {
    table: "admin_price_catalog",
    column: "monthly_gross",
    since: "017_admin_analytics.sql",
  },

  // --- 018: Zustimmung AGB/Datenschutz/AVV --------------------------------
  {
    table: "users",
    column: "terms_accepted_at",
    since: "018_terms_consent.sql",
  },
];

/** Kompaktes `tabelle.spalte`-Kürzel – Format der `missing`-Liste in /api/health. */
export function formatColumn(c: Pick<ExpectedColumn, "table" | "column">) {
  return `${c.table}.${c.column}`;
}

/**
 * Baut die Warnzeile für das Log: gruppiert die fehlenden Spalten nach der
 * Migration, die sie einführt – das ist die Datei, die vermutlich fehlt.
 */
export function formatMissingWarning(missing: ExpectedColumn[]): string {
  const byMigration = new Map<string, string[]>();
  for (const c of missing) {
    const list = byMigration.get(c.since) ?? [];
    list.push(formatColumn(c));
    byMigration.set(c.since, list);
  }
  const parts = [...byMigration.entries()].map(
    ([migration, cols]) => `${migration} (${cols.join(", ")})`,
  );
  return `⚠️ Migration fehlt vermutlich: ${parts.join(" | ")}`;
}

/**
 * Vergleicht die Ist-Spalten der Datenbank mit `EXPECTED_COLUMNS`.
 * Reine Mengen-Logik ohne DB-Zugriff, damit sie testbar bleibt.
 *
 * @param actual Vorhandene Spalten als `tabelle.spalte`-Kürzel.
 */
export function findMissingColumns(
  actual: Iterable<string>,
  expected: ExpectedColumn[] = EXPECTED_COLUMNS,
): ExpectedColumn[] {
  const present = new Set(actual);
  return expected.filter((c) => !present.has(formatColumn(c)));
}
