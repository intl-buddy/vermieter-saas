import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import type { Database } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateRecordDialog, type RecordValues } from "./CreateRecordDialog";
import { RecordRowActions } from "./RecordRowActions";
import { EuerExport } from "./EuerExport";
import { COST_TYPE_LABELS, COST_TYPE_OPTIONS } from "./labels";

export const metadata = { title: "Belege · tefter" };

type CostType = Database["public"]["Enums"]["operating_cost_type"];

const SELECT_CLS =
  "h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function BelegePage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string; jahr?: string; kostenart?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name")
    .order("name");
  const propertyIds = new Set((properties ?? []).map((p) => p.id));

  // Filter validieren
  const objekt =
    params.objekt && propertyIds.has(params.objekt) ? params.objekt : "";
  const kostenart =
    params.kostenart && params.kostenart in COST_TYPE_LABELS
      ? (params.kostenart as CostType)
      : "";
  const jahr =
    params.jahr && /^\d{4}$/.test(params.jahr) ? params.jahr : "";

  let query = supabase
    .from("operating_costs_records")
    .select(
      "id, invoice_date, invoice_number, paid_date, cost_type, vendor, amount, gross_amount, vat_rate, allocation_key, billing_period_start, billing_period_end, is_apportionable, receipt_url, notes, property_id, properties(name, street, house_number, zip, city)",
    );
  if (objekt) query = query.eq("property_id", objekt);
  if (kostenart) query = query.eq("cost_type", kostenart);
  if (jahr) {
    query = query
      .gte("invoice_date", `${jahr}-01-01`)
      .lte("invoice_date", `${jahr}-12-31`);
  }
  const [{ data: records }, { count: missingCount }] = await Promise.all([
    query.order("invoice_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("operating_costs_records")
      .select("id", { count: "exact", head: true })
      .is("paid_date", null),
  ]);

  // Signierte Download-URLs für vorhandene Belege
  const downloadUrls = new Map<string, string>();
  await Promise.all(
    (records ?? [])
      .filter((r) => r.receipt_url)
      .map(async (r) => {
        const { data: signed } = await supabase.storage
          .from("receipts")
          .createSignedUrl(r.receipt_url as string, 300);
        if (signed?.signedUrl) downloadUrls.set(r.id, signed.signedUrl);
      }),
  );

  return (
    <AppShell title="Belege" userEmail={user.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Belege
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Betriebskosten-Belege für die Nebenkostenabrechnung und EÜR.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EuerExport currentYear={currentYear} missingCount={missingCount ?? 0} />
          <CreateRecordDialog
            properties={properties ?? []}
            defaultPropertyId={objekt || undefined}
          />
        </div>
      </div>

      {/* Filter */}
      <form
        method="get"
        className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-objekt" className="text-xs font-medium text-neutral-600">
            Objekt
          </label>
          <select id="f-objekt" name="objekt" defaultValue={objekt} className={SELECT_CLS}>
            <option value="">Alle Objekte</option>
            {(properties ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-jahr" className="text-xs font-medium text-neutral-600">
            Jahr
          </label>
          <select id="f-jahr" name="jahr" defaultValue={jahr} className={SELECT_CLS}>
            <option value="">Alle Jahre</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="f-kostenart" className="text-xs font-medium text-neutral-600">
            Kostenart
          </label>
          <select
            id="f-kostenart"
            name="kostenart"
            defaultValue={kostenart}
            className={SELECT_CLS}
          >
            <option value="">Alle Kostenarten</option>
            {COST_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Filtern
        </Button>
        {objekt || jahr || kostenart ? (
          <Button asChild variant="ghost">
            <Link href="/belege">Zurücksetzen</Link>
          </Button>
        ) : null}
      </form>

      {!records || records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-base font-medium">Noch keine Belege erfasst</p>
            <p className="text-sm text-muted-foreground">
              Erfasse deinen ersten Betriebskosten-Beleg.
            </p>
            <CreateRecordDialog
              properties={properties ?? []}
              defaultPropertyId={objekt || undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Datum</TableHead>
                <TableHead>Kostenart</TableHead>
                <TableHead>Objekt</TableHead>
                <TableHead>Lieferant</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead className="whitespace-nowrap">EÜR-Jahr</TableHead>
                <TableHead>Umlage</TableHead>
                <TableHead className="text-right">Beleg</TableHead>
                <TableHead className="sticky right-0 z-10 w-12 border-l border-neutral-100 bg-white" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => {
                const property = r.properties as {
                  name: string;
                  street: string;
                  house_number: string;
                  zip: string;
                  city: string;
                } | null;
                const fullAddress = property
                  ? `${property.name} · ${property.street} ${property.house_number}, ${property.zip} ${property.city}`
                  : "";
                const url = downloadUrls.get(r.id);
                const values: RecordValues = {
                  id: r.id,
                  property_id: r.property_id,
                  cost_type: r.cost_type,
                  vendor: r.vendor,
                  invoice_number: r.invoice_number,
                  invoice_date: r.invoice_date,
                  paid_date: r.paid_date,
                  gross_amount: r.gross_amount,
                  vat_rate: r.vat_rate,
                  amount: r.amount,
                  allocation_key: r.allocation_key,
                  billing_period_start: r.billing_period_start,
                  billing_period_end: r.billing_period_end,
                  is_apportionable: r.is_apportionable,
                  receipt_url: r.receipt_url,
                  notes: r.notes,
                };
                return (
                  <TableRow key={r.id} className="group">
                    <TableCell className="whitespace-nowrap">
                      {formatDate(r.invoice_date)}
                    </TableCell>
                    <TableCell>{COST_TYPE_LABELS[r.cost_type]}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span
                        className="block max-w-[180px] truncate"
                        title={fullAddress}
                      >
                        {property?.name ?? "–"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span
                        className="block max-w-[160px] truncate"
                        title={r.vendor ?? undefined}
                      >
                        {r.vendor || "–"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(r.gross_amount ?? r.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.paid_date ? (
                        <span className="tabular-nums">
                          {r.paid_date.slice(0, 4)}
                        </span>
                      ) : (
                        <Badge variant="warning">Zahlungsdatum fehlt</Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.is_apportionable ? (
                        <Badge variant="success">umlagefähig</Badge>
                      ) : (
                        <Badge variant="neutral">nicht umlagefähig</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-secondary hover:underline"
                          aria-label="Beleg herunterladen"
                        >
                          <FileText className="size-4" />
                        </a>
                      ) : (
                        <span className="text-neutral-300">–</span>
                      )}
                    </TableCell>
                    <TableCell className="sticky right-0 z-10 border-l border-neutral-100 bg-white text-right group-hover:bg-neutral-50">
                      <RecordRowActions
                        record={values}
                        properties={properties ?? []}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </AppShell>
  );
}
