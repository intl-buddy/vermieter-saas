import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { formatDate } from "../../../../lib/format";
import { SiteHeader } from "../../../components/SiteHeader";
import {
  MahnungPreviewForm,
  type PreviewCharge,
} from "./MahnungPreviewForm";
import styles from "../detail.module.css";

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

  // Kein Rückstand → keine Mahnung nötig.
  if (openTotal <= 0) {
    return (
      <div className={styles.container}>
        <SiteHeader />
        <main className={styles.main}>
          <div className={styles.breadcrumb}>
            <Link href={`/mieteingang/${tenantId}`} className={styles.backLink}>
              ← Zurück zum Mieter
            </Link>
          </div>
          <h1 className={styles.title}>Mahnung erstellen</h1>
          <div className={styles.empty}>
            Für {tenantName} bestehen aktuell keine offenen Forderungen.
          </div>
        </main>
      </div>
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
    <div className={styles.container}>
      <SiteHeader />
      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href={`/mieteingang/${tenantId}`} className={styles.backLink}>
            ← Zurück zum Mieter
          </Link>
        </div>

        <h1 className={styles.title}>Mahnung erstellen</h1>
        <p className={styles.subtitle}>
          Mieter: {tenantName}. Prüfe Stufe, Gebühr und Frist vor dem Erzeugen.
        </p>

        <MahnungPreviewForm
          tenantId={tenantId}
          suggestedLevel={suggestedLevel}
          dunningFee={dunningFee}
          charges={charges}
          defaultDeadline={isoInDays(deadlineDays)}
          hint={hint}
        />
      </main>
    </div>
  );
}
