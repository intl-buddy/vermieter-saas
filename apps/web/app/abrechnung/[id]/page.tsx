import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AbrechnungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: run } = await supabase
    .from("billing_runs")
    .select("id, period_start, period_end, total_costs, tenant_count, properties(name)")
    .eq("id", id)
    .maybeSingle();
  if (!run) {
    notFound();
  }
  const prop = run.properties as { name: string } | null;

  const { data: statements } = await supabase
    .from("billing_statements")
    .select(
      "id, total_share, heating_costs, balance, pdf_url, tenants(first_name, last_name), units(label)",
    )
    .eq("billing_run_id", id);

  const downloadUrls = new Map<string, string>();
  await Promise.all(
    (statements ?? [])
      .filter((s) => s.pdf_url)
      .map(async (s) => {
        const { data: signed } = await supabase.storage
          .from("statements")
          .createSignedUrl(s.pdf_url as string, 300);
        if (signed?.signedUrl) downloadUrls.set(s.id, signed.signedUrl);
      }),
  );

  return (
    <AppShell title="Abrechnung" userEmail={user.email ?? ""}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/abrechnung">
          <ArrowLeft className="size-4" />
          Zurück zur Übersicht
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {prop?.name ?? "Abrechnung"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Zeitraum {formatDate(run.period_start)} – {formatDate(run.period_end)}{" "}
          · {run.tenant_count} Mieter · Gesamtkosten{" "}
          {formatCurrency(run.total_costs)}
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mieter</TableHead>
              <TableHead>Einheit</TableHead>
              <TableHead className="text-right">Anteil</TableHead>
              <TableHead className="text-right">Heizkosten</TableHead>
              <TableHead className="text-right">Ergebnis</TableHead>
              <TableHead className="text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(statements ?? []).map((s) => {
              const t = s.tenants as {
                first_name: string;
                last_name: string;
              } | null;
              const u = s.units as { label: string } | null;
              const url = downloadUrls.get(s.id);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {t ? `${t.first_name} ${t.last_name}` : "–"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u?.label ?? "–"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(s.total_share)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(s.heating_costs)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums ${
                      s.balance > 0 ? "text-danger-600" : "text-success-700"
                    }`}
                  >
                    {s.balance > 0 ? "Nachz. " : "Guth. "}
                    {formatCurrency(Math.abs(s.balance))}
                  </TableCell>
                  <TableCell className="text-right">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-secondary hover:underline"
                        aria-label="Abrechnung herunterladen"
                      >
                        <FileText className="size-4" />
                      </a>
                    ) : (
                      <span className="text-neutral-300">–</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
