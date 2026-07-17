import { NextResponse } from "next/server";
import {
  EXPECTED_COLUMNS,
  formatColumn,
  formatMissingWarning,
  type ExpectedColumn,
} from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PostgREST-Code: Funktion existiert nicht (→ Migration 012 fehlt). */
const PGRST_FUNCTION_NOT_FOUND = "PGRST202";

type SchemaState = "ok" | "drift" | "ungeprüft";

interface SchemaResult {
  schema: SchemaState;
  /** Fehlende Spalten als `tabelle.spalte` – nur bei `drift`. */
  missing?: string[];
  /** Grund, warum nicht geprüft werden konnte – nur bei `ungeprüft`. */
  note?: string;
}

/**
 * Migrations-Wächter: prüft die erwarteten Spalten (EXPECTED_COLUMNS aus
 * packages/core) gegen information_schema – via RPC `missing_schema_columns`
 * (Migration 012), da PostgREST information_schema nicht direkt ausliefert.
 *
 * Wirft bewusst nicht: Ein nicht durchführbarer Schema-Check heißt nicht, dass
 * die DB unten ist. Ergebnis ist dann `ungeprüft` → degraded, nicht 503.
 */
async function checkSchema(): Promise<SchemaResult> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return {
      schema: "ungeprüft",
      note: "SUPABASE_SERVICE_ROLE_KEY fehlt – Schema-Wächter übersprungen.",
    };
  }

  const expected = EXPECTED_COLUMNS.map((c) => ({
    tbl: c.table,
    col: c.column,
  }));

  const { data, error } = await admin.rpc("missing_schema_columns", {
    expected,
  });

  if (error) {
    const note =
      error.code === PGRST_FUNCTION_NOT_FOUND
        ? "RPC missing_schema_columns fehlt – 012_schema_guard.sql einspielen."
        : `Schema-Wächter fehlgeschlagen: ${error.message}`;
    console.warn(`⚠️ Migration fehlt vermutlich: ${note}`);
    return { schema: "ungeprüft", note };
  }

  // Zurück auf ExpectedColumn mappen, damit die Warnung die Migration nennt.
  const missing: ExpectedColumn[] = (data ?? []).map(
    (row) =>
      EXPECTED_COLUMNS.find(
        (c) => c.table === row.missing_table && c.column === row.missing_column,
      ) ?? {
        table: row.missing_table,
        column: row.missing_column,
        since: "unbekannt",
      },
  );

  if (missing.length === 0) return { schema: "ok" };

  console.warn(formatMissingWarning(missing));
  return { schema: "drift", missing: missing.map(formatColumn) };
}

/**
 * Healthcheck für Docker/Coolify:
 *   200 {status:'ok'}       – App läuft, Supabase erreichbar, Schema komplett.
 *   200 {status:'degraded'} – erreichbar, aber Schema-Drift (fehlende Migration)
 *                             oder Schema nicht prüfbar. Bewusst 200, damit der
 *                             Container healthy bleibt.
 *   503 {status:'error'}    – Supabase nicht erreichbar → unhealthy.
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    const supabase = await createClient();
    // Leichte Reachability-Query (RLS liefert ggf. 0 Zeilen – wichtig ist,
    // dass PostgREST/DB antwortet, nicht das Ergebnis).
    const { error } = await supabase
      .from("properties")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: "error", supabase: "down", error: error.message, timestamp },
        { status: 503 },
      );
    }

    const schema = await checkSchema();

    return NextResponse.json(
      {
        status: schema.schema === "ok" ? "ok" : "degraded",
        supabase: "up",
        ...schema,
        timestamp,
      },
      { status: 200 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        status: "error",
        supabase: "down",
        error: e instanceof Error ? e.message : "unbekannter Fehler",
        timestamp,
      },
      { status: 503 },
    );
  }
}
