import JSZip from "jszip";
import type { SupabaseServerClient } from "@/lib/supabase/server";

/** Nutzerbezogene Tabellen → Dateiname im Export. */
const EXPORT_TABLES: { table: string; file: string }[] = [
  { table: "properties", file: "objekte.csv" },
  { table: "units", file: "einheiten.csv" },
  { table: "tenants", file: "mieter.csv" },
  { table: "rent_payments", file: "zahlungen.csv" },
  { table: "rent_charges", file: "soll-stellungen.csv" },
  { table: "operating_costs_records", file: "belege.csv" },
  { table: "generated_tasks", file: "aufgaben.csv" },
  { table: "task_templates", file: "aufgaben-vorlagen.csv" },
  { table: "billing_runs", file: "abrechnungen.csv" },
  { table: "billing_statements", file: "abrechnungen-positionen.csv" },
  { table: "dunning_letters", file: "mahnungen.csv" },
  { table: "tenant_person_periods", file: "personenzeiten.csv" },
];

const FILE_BUCKETS = ["receipts", "dunning", "statements"] as const;

/** Ein CSV-Feld robust escapen (Trennzeichen, Anführungszeichen, Zeilenumbruch). */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/["\n\r;,]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/** Array von Objekten → CSV (mit BOM für Excel-Kompatibilität, Semikolon-getrennt). */
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "﻿";
  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(";")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvCell(row[h])).join(";"));
  }
  return "﻿" + lines.join("\r\n");
}

/** Rekursiv alle Datei-Pfade unter einem Prefix in einem Bucket auflisten. */
async function listAllPaths(
  supabase: SupabaseServerClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });
  if (error || !data) return out;
  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) {
      out.push(...(await listAllPaths(supabase, bucket, path)));
    } else {
      out.push(path);
    }
  }
  return out;
}

/**
 * Baut ein ZIP-Archiv mit allen Tabellendaten (CSV) und Storage-Dateien des
 * Nutzers. Alle Abfragen laufen über den nutzergebundenen Client (RLS), es
 * werden also nur eigene Daten exportiert.
 */
export async function buildUserExportZip(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Uint8Array> {
  const zip = new JSZip();
  const dataDir = zip.folder("daten")!;
  const fileDir = zip.folder("dateien")!;

  // Profil (eigene users-Zeile).
  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, email, full_name, company_name, address_street, address_zip, address_city, phone, iban, bank_name, bic, plan, subscription_status, created_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (profile) {
    dataDir.file("profil.csv", toCsv([profile as Record<string, unknown>]));
  }

  // Alle nutzerbezogenen Tabellen (RLS filtert automatisch auf den Nutzer).
  for (const { table, file } of EXPORT_TABLES) {
    const { data } = await supabase.from(table as never).select("*");
    dataDir.file(file, toCsv((data ?? []) as Record<string, unknown>[]));
  }

  // Storage-Dateien.
  for (const bucket of FILE_BUCKETS) {
    const paths = await listAllPaths(supabase, bucket, userId);
    for (const path of paths) {
      const { data: blob } = await supabase.storage.from(bucket).download(path);
      if (!blob) continue;
      const buf = new Uint8Array(await blob.arrayBuffer());
      // Nutzer-Prefix aus dem Zielpfad entfernen (userId/… → …).
      const rel = path.startsWith(`${userId}/`)
        ? path.slice(userId.length + 1)
        : path;
      fileDir.file(`${bucket}/${rel}`, buf);
    }
  }

  // README
  zip.file(
    "LIESMICH.txt",
    "Dieser Export enthält alle deine in tefter gespeicherten Daten.\r\n" +
      "- Ordner 'daten': alle Tabellen als CSV (Semikolon-getrennt, UTF-8).\r\n" +
      "- Ordner 'dateien': alle hochgeladenen Belege, Mahnungen und Abrechnungs-PDFs.\r\n\r\n" +
      "Export erstellt gemäß Art. 20 DSGVO (Recht auf Datenübertragbarkeit).\r\n",
  );

  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
