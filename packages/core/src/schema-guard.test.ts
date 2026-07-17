import { describe, it, expect } from "vitest";
import {
  EXPECTED_COLUMNS,
  findMissingColumns,
  formatColumn,
  formatMissingWarning,
  type ExpectedColumn,
} from "./schema-guard";

const all = () => EXPECTED_COLUMNS.map(formatColumn);

describe("EXPECTED_COLUMNS", () => {
  it("enthält keine Duplikate", () => {
    const keys = all();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("nennt für jede Spalte die einführende Migration", () => {
    for (const c of EXPECTED_COLUMNS) {
      expect(c.since, formatColumn(c)).toMatch(/^\d{3}_.+\.sql$/);
    }
  });

  it("deckt die Lebenszyklus- und Abrechnungs-Spalten ab", () => {
    // Stichproben aus 006–010: bricht, falls jemand die Liste versehentlich kürzt.
    expect(all()).toEqual(
      expect.arrayContaining([
        "users.access_until",
        "users.trial_ends_at",
        "users.subscription_id",
        "users.cancel_at_period_end",
        "tenants.advance_mode",
        "billing_statements.labor_35a_household",
        "billing_statements.prepayments_source",
        "billing_statements.occupancy_days",
        "billing_runs.tenant_count",
        "deletion_log.user_id_hash",
      ]),
    );
  });

  it("listet keine in 008 entfernten Spalten", () => {
    expect(all()).not.toContain("billing_statements.total_35a_household");
    expect(all()).not.toContain("billing_statements.total_35a_craftsman");
  });
});

describe("findMissingColumns", () => {
  it("meldet nichts, wenn alle Spalten vorhanden sind", () => {
    expect(findMissingColumns(all())).toEqual([]);
  });

  it("meldet genau die fehlenden Spalten", () => {
    const ist = all().filter(
      (c) => c !== "users.access_until" && c !== "tenants.advance_mode",
    );
    // Reihenfolge folgt EXPECTED_COLUMNS (007 vor 010), nicht der Eingabe.
    expect(findMissingColumns(ist).map(formatColumn)).toEqual([
      "tenants.advance_mode",
      "users.access_until",
    ]);
  });

  it("meldet bei leerer Datenbank alle erwarteten Spalten", () => {
    expect(findMissingColumns([])).toHaveLength(EXPECTED_COLUMNS.length);
  });

  it("ignoriert zusätzliche Spalten in der Datenbank", () => {
    expect(findMissingColumns([...all(), "users.experiment"])).toEqual([]);
  });
});

describe("formatMissingWarning", () => {
  const missing: ExpectedColumn[] = [
    { table: "users", column: "access_until", since: "010_lifecycle.sql" },
    { table: "users", column: "deleted_at", since: "010_lifecycle.sql" },
    { table: "tenants", column: "advance_mode", since: "007_advance_mode.sql" },
  ];

  it("gruppiert die fehlenden Spalten nach Migration", () => {
    const warning = formatMissingWarning(missing);
    expect(warning).toBe(
      "⚠️ Migration fehlt vermutlich: " +
        "010_lifecycle.sql (users.access_until, users.deleted_at) | " +
        "007_advance_mode.sql (tenants.advance_mode)",
    );
  });
});
