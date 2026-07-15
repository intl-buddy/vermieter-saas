import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Database } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";
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
import { PaymentForm } from "./PaymentForm";
import { MarkSentButton } from "./MarkSentButton";
import { SendDunningDialog } from "./SendDunningDialog";
import { TenantEditDialog, type TenantValues } from "../../objekte/[id]/TenantEditDialog";

type PayerType = Database["public"]["Enums"]["payer_type"];
type DunningStatus = Database["public"]["Enums"]["dunning_status"];
type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const PAYER_LABELS: Record<PayerType, string> = {
  tenant: "Mieter",
  jobcenter: "Jobcenter",
  other: "Sonstige",
};

const DUNNING_STATUS: Record<
  DunningStatus,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "Entwurf", variant: "neutral" },
  sent: { label: "Versendet", variant: "success" },
  resolved: { label: "Erledigt", variant: "neutral" },
  obsolete: { label: "Gegenstandslos", variant: "outline" },
};

const DUNNING_LEVEL: Record<
  number,
  { label: string; variant: BadgeVariant }
> = {
  1: { label: "Stufe 1 – Zahlungserinnerung", variant: "warning" },
  2: { label: "Stufe 2 – Mahnung", variant: "orange" },
  3: { label: "Stufe 3 – Letzte Mahnung", variant: "danger" },
};

export default async function MieteingangDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zusätzliche Absicherung zur Middleware.
  if (!user) {
    redirect("/login");
  }

  // Mieter laden (dient auch als Zugriffs-/Existenzprüfung via RLS).
  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "id, first_name, last_name, email, phone, persons_count, move_in_date, cold_rent, operating_costs_advance, heating_costs_advance, rent_due_day, deposit_type, deposit_amount, deposit_paid, iban, notes, unit_id",
    )
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) {
    notFound();
  }

  const tenantName =
    [tenant.first_name, tenant.last_name].filter(Boolean).join(" ").trim() ||
    "Unbenannter Mieter";

  // Objekt des Mieters für den (wiederverwendeten) Bearbeiten-Dialog auflösen.
  const { data: tenantUnit } = await supabase
    .from("units")
    .select("property_id")
    .eq("id", tenant.unit_id)
    .maybeSingle();
  const tenantValues: TenantValues = {
    id: tenant.id,
    first_name: tenant.first_name,
    last_name: tenant.last_name,
    email: tenant.email,
    phone: tenant.phone,
    persons_count: tenant.persons_count,
    move_in_date: tenant.move_in_date,
    cold_rent: tenant.cold_rent,
    operating_costs_advance: tenant.operating_costs_advance,
    heating_costs_advance: tenant.heating_costs_advance,
    rent_due_day: tenant.rent_due_day,
    deposit_type: tenant.deposit_type,
    deposit_amount: tenant.deposit_amount,
    deposit_paid: tenant.deposit_paid,
    iban: tenant.iban,
    notes: tenant.notes,
  };

  const [
    { data: openCharges, error: chargesError },
    { data: payments, error: paymentsError },
    { data: dunningLetters, error: dunningError },
  ] = await Promise.all([
    supabase.rpc("open_charges", { p_tenant_id: tenantId }),
    supabase
      .from("rent_payments")
      .select("id, amount, paid_at, payer, bank_reference, notes, created_at")
      .eq("tenant_id", tenantId)
      .order("paid_at", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("dunning_letters")
      .select("id, level, issued_at, amount_due, fee, status, pdf_url")
      .eq("tenant_id", tenantId)
      .order("issued_at", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const totalOpen = (openCharges ?? []).reduce(
    (sum, charge) => sum + (charge.open_amount ?? 0),
    0,
  );

  // Signierte Download-URLs für gespeicherte Mahn-PDFs (privater Bucket).
  // Fällt der signierte Link aus (z. B. Bucket noch nicht angelegt), dient die
  // Live-Render-Route als Ausweichlink.
  const downloadUrls = new Map<string, string>();
  await Promise.all(
    (dunningLetters ?? []).map(async (letter) => {
      if (letter.pdf_url) {
        const { data: signed } = await supabase.storage
          .from("dunning")
          .createSignedUrl(letter.pdf_url, 300);
        if (signed?.signedUrl) {
          downloadUrls.set(letter.id, signed.signedUrl);
          return;
        }
      }
      downloadUrls.set(letter.id, `/mahnungen/${letter.id}/pdf`);
    }),
  );

  return (
    <AppShell title="Mieteingang" userEmail={user.email ?? ""}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/mieteingang">
          <ArrowLeft className="size-4" />
          Zurück zur Übersicht
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {tenantName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Offene Monate, Zahlungshistorie und Zahlungserfassung.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TenantEditDialog
            tenant={tenantValues}
            propertyId={tenantUnit?.property_id ?? ""}
            trigger={<Button variant="outline">Mieter bearbeiten</Button>}
          />
          {totalOpen > 0 ? (
            <Button asChild variant="destructive">
              <Link href={`/mieteingang/${tenantId}/mahnung`}>
                Mahnung erstellen
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {/* (a) Offene Monate */}
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Offene Monate</h2>
          {openCharges && openCharges.length > 0 ? (
            <Badge variant="danger">
              Offener Rest gesamt: {formatCurrency(totalOpen)}
            </Badge>
          ) : null}
        </div>

        {chargesError ? (
          <Card>
            <CardContent className="p-6 text-sm text-danger-700">
              Die offenen Monate konnten nicht geladen werden:{" "}
              {chargesError.message}
            </CardContent>
          </Card>
        ) : !openCharges || openCharges.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Keine offenen Monate. 🎉
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monat</TableHead>
                  <TableHead>Fälligkeit</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead className="text-right">Offener Rest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openCharges.map((charge) => (
                  <TableRow key={charge.charge_id}>
                    <TableCell>{formatMonth(charge.period)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(charge.due_date)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(charge.total_amount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-danger-600">
                      {formatCurrency(charge.open_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      {/* (b) Zahlungshistorie */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Zahlungshistorie</h2>

        {paymentsError ? (
          <Card>
            <CardContent className="p-6 text-sm text-danger-700">
              Die Zahlungshistorie konnte nicht geladen werden:{" "}
              {paymentsError.message}
            </CardContent>
          </Card>
        ) : !payments || payments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Es wurden noch keine Zahlungen erfasst.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wertstellung</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Zahler</TableHead>
                  <TableHead>Verwendungszweck</TableHead>
                  <TableHead>Notiz</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(payment.paid_at)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold tabular-nums ${
                        payment.amount < 0
                          ? "text-danger-600"
                          : "text-success-700"
                      }`}
                    >
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {PAYER_LABELS[payment.payer] ?? payment.payer}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span
                        className="block max-w-[200px] truncate"
                        title={payment.bank_reference ?? undefined}
                      >
                        {payment.bank_reference || "–"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span
                        className="block max-w-[200px] truncate"
                        title={payment.notes ?? undefined}
                      >
                        {payment.notes || "–"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      {/* (c) Mahnhistorie */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Mahnhistorie</h2>

        {dunningError ? (
          <Card>
            <CardContent className="p-6 text-sm text-danger-700">
              Die Mahnhistorie konnte nicht geladen werden: {dunningError.message}
            </CardContent>
          </Card>
        ) : !dunningLetters || dunningLetters.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Es wurden noch keine Mahnungen erstellt.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stufe</TableHead>
                  <TableHead className="whitespace-nowrap">Datum</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="sticky right-0 z-10 border-l border-neutral-100 bg-white">
                    Aktionen
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dunningLetters.map((letter) => {
                  const status = DUNNING_STATUS[letter.status];
                  const level = DUNNING_LEVEL[letter.level] ?? {
                    label: `Stufe ${letter.level}`,
                    variant: "neutral" as BadgeVariant,
                  };
                  return (
                    <TableRow key={letter.id} className="group">
                      <TableCell className="whitespace-nowrap">
                        <Badge
                          variant={level.variant}
                          title={level.label}
                        >
                          Stufe {letter.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(letter.issued_at)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(letter.amount_due + letter.fee)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="sticky right-0 z-10 border-l border-neutral-100 bg-white group-hover:bg-neutral-50">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            asChild
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                          >
                            <a
                              href={downloadUrls.get(letter.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              PDF
                            </a>
                          </Button>
                          {letter.status === "draft" ? (
                            <>
                              <SendDunningDialog
                                dunningId={letter.id}
                                level={letter.level}
                                amountTotal={letter.amount_due + letter.fee}
                                tenantEmail={tenant.email}
                              />
                              <MarkSentButton
                                dunningId={letter.id}
                                tenantId={tenantId}
                              />
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      {/* (d) Zahlung erfassen */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Zahlung erfassen</h2>
        <Card>
          <CardContent className="p-6">
            <PaymentForm tenantId={tenantId} />
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
