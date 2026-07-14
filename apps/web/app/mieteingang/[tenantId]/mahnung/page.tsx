import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MahnungPreviewForm, type PreviewCharge } from "./MahnungPreviewForm";

/** Heutiges Datum als `YYYY-MM-DD` in lokaler Zeit. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/** Datum in `days` Tagen als `YYYY-MM-DD`. */
function isoInDays(days: number): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const base = new Date(now.getTime() - offset * 60_000);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export default async function MahnungPreviewPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, first_name, last_name")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant) {
    notFound();
  }

  const tenantName =
    [tenant.first_name, tenant.last_name].filter(Boolean).join(" ").trim() ||
    "Unbenannter Mieter";

  const [{ data: openCharges }, { data: letters }, { data: profile }] =
    await Promise.all([
      supabase.rpc("open_charges", { p_tenant_id: tenantId }),
      supabase
        .from("dunning_letters")
        .select("level, payment_deadline, status")
        .eq("tenant_id", tenantId),
      supabase
        .from("users")
        .select("dunning_fee, dunning_deadline_days")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  const charges: PreviewCharge[] = (openCharges ?? []).map((c) => ({
    period: c.period,
    totalAmount: c.total_amount,
    openAmount: c.open_amount,
  }));
  const openTotal = charges.reduce((sum, c) => sum + c.openAmount, 0);

  const backLink = (
    <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
      <Link href={`/mieteingang/${tenantId}`}>
        <ArrowLeft className="size-4" />
        Zurück zum Mieter
      </Link>
    </Button>
  );

  // Kein Rückstand → keine Mahnung nötig.
  if (openTotal <= 0) {
    return (
      <AppShell title="Mahnung erstellen" userEmail={user.email ?? ""}>
        {backLink}
        <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
          Mahnung erstellen
        </h1>
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Für {tenantName} bestehen aktuell keine offenen Forderungen.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  // Stufenvorschlag: höchste versendete Stufe + 1 (max. 3), sofern deren Frist
  // abgelaufen ist. Läuft sie noch, Hinweis anzeigen und Stufe manuell wählbar.
  const today = todayIso();
  const sentLetters = (letters ?? []).filter((l) => l.status === "sent");
  let suggestedLevel = 1;
  let hint: string | null = null;

  if (sentLetters.length > 0) {
    const highestSent = Math.max(...sentLetters.map((l) => l.level));
    const nextLevel = Math.min(highestSent + 1, 3);
    suggestedLevel = nextLevel;

    // Frist der zuletzt (auf höchster Stufe) versendeten Mahnung.
    const latestDeadline = sentLetters
      .filter((l) => l.level === highestSent)
      .map((l) => l.payment_deadline)
      .sort()
      .at(-1);

    if (latestDeadline && latestDeadline >= today) {
      hint = `Frist der letzten Mahnung läuft noch bis ${formatDate(latestDeadline)}. Stufe bitte manuell prüfen.`;
    }
  }

  const deadlineDays = profile?.dunning_deadline_days ?? 14;
  const dunningFee = profile?.dunning_fee ?? 0;

  return (
    <AppShell title="Mahnung erstellen" userEmail={user.email ?? ""}>
      {backLink}

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Mahnung erstellen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mieter: {tenantName}. Prüfe Stufe, Gebühr und Frist vor dem Erzeugen.
        </p>
      </div>

      <MahnungPreviewForm
        tenantId={tenantId}
        suggestedLevel={suggestedLevel}
        dunningFee={dunningFee}
        charges={charges}
        defaultDeadline={isoInDays(deadlineDays)}
        hint={hint}
      />
    </AppShell>
  );
}
