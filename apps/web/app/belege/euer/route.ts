import { createClient } from "@/lib/supabase/server";
import { COST_TYPE_LABELS } from "../labels";
import type { Database } from "@repo/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CostType = Database["public"]["Enums"]["operating_cost_type"];

/** Deutsche Zahl mit Dezimalkomma, ohne Tausenderpunkt (CSV-freundlich). */
function num(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

/** `YYYY-MM-DD` → `DD.MM.YYYY`. */
function deDate(value: string | null): string {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}`;
}

/** CSV-Zelle mit Semikolon-Trennung sicher escapen. */
function cell(value: string): string {
  if (/[";\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = Number(searchParams.get("jahr"));
  const year =
    Number.isInteger(yearParam) && yearParam >= 2000 && yearParam <= 2100
      ? yearParam
      : new Date().getFullYear();

  const { data: records } = await supabase
    .from("operating_costs_records")
    .select(
      "paid_date, cost_type, vendor, invoice_number, gross_amount, vat_rate, is_apportionable, properties(name)",
    )
    .gte("paid_date", `${year}-01-01`)
    .lte("paid_date", `${year}-12-31`)
    .order("paid_date", { ascending: true });

  const header = [
    "Zahlungsdatum",
    "Kostenart",
    "Lieferant",
    "Rechnungsnr.",
    "Objekt",
    "Brutto",
    "USt-Satz",
    "Netto",
    "umlagefähig",
  ];

  const rows = (records ?? []).map((r) => {
    const gross = r.gross_amount;
    const rate = r.vat_rate ?? 0;
    const net = gross != null ? gross / (1 + rate / 100) : null;
    const property = r.properties as { name: string } | null;
    return [
      deDate(r.paid_date),
      COST_TYPE_LABELS[r.cost_type as CostType] ?? r.cost_type,
      r.vendor ?? "",
      r.invoice_number ?? "",
      property?.name ?? "",
      gross != null ? num(gross) : "",
      `${rate} %`,
      net != null ? num(net) : "",
      r.is_apportionable ? "ja" : "nein",
    ];
  });

  const body =
    [header, ...rows]
      .map((cols) => cols.map((c) => cell(String(c))).join(";"))
      .join("\r\n");
  const csv = "\uFEFF" + body; // UTF-8 BOM für Excel

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="EUER-${year}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
