import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@repo/core";
import { createClient } from "../../../lib/supabase/server";
import {
  formatCurrency,
  formatDate,
  formatMonth,
} from "../../../lib/format";
import { SiteHeader } from "../../components/SiteHeader";
import { PaymentForm } from "./PaymentForm";
import styles from "./detail.module.css";

type RentPayer = Database["public"]["Enums"]["rent_payer"];

const PAYER_LABELS: Record<RentPayer, string> = {
  tenant: "Mieter",
  jobcenter: "Jobcenter",
  other: "Sonstige",
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
    .select("id, first_name, last_name")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) {
    notFound();
  }

  const tenantName =
    [tenant.first_name, tenant.last_name].filter(Boolean).join(" ").trim() ||
    "Unbenannter Mieter";

  const [{ data: openCharges, error: chargesError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase.rpc("open_charges", { p_tenant_id: tenantId }),
      supabase
        .from("rent_payments")
        .select("id, amount, value_date, payer, purpose, note, created_at")
        .eq("tenant_id", tenantId)
        .order("value_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

  const totalOpen = (openCharges ?? []).reduce(
    (sum, charge) => sum + (charge.open_amount ?? 0),
    0,
  );

  return (
    <div className={styles.container}>
      <SiteHeader />

      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href="/mieteingang" className={styles.backLink}>
            ← Zurück zur Übersicht
          </Link>
        </div>

        <h1 className={styles.title}>{tenantName}</h1>
        <p className={styles.subtitle}>
          Offene Monate, Zahlungshistorie und Zahlungserfassung.
        </p>

        {/* (a) Offene Monate */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Offene Monate</h2>
            {openCharges && openCharges.length > 0 ? (
              <span className={styles.pill}>
                Offener Rest gesamt: {formatCurrency(totalOpen)}
              </span>
            ) : null}
          </div>

          {chargesError ? (
            <div className={styles.error}>
              Die offenen Monate konnten nicht geladen werden:{" "}
              {chargesError.message}
            </div>
          ) : !openCharges || openCharges.length === 0 ? (
            <div className={styles.empty}>Keine offenen Monate. 🎉</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thLeft}>Monat</th>
                    <th className={styles.thLeft}>Fälligkeit</th>
                    <th className={styles.thRight}>Betrag</th>
                    <th className={styles.thRight}>Offener Rest</th>
                  </tr>
                </thead>
                <tbody>
                  {openCharges.map((charge) => (
                    <tr key={charge.charge_id}>
                      <td className={styles.tdLeft}>
                        {formatMonth(charge.period_month)}
                      </td>
                      <td className={styles.tdLeft}>
                        {formatDate(charge.due_date)}
                      </td>
                      <td className={styles.tdRight}>
                        {formatCurrency(charge.amount)}
                      </td>
                      <td className={`${styles.tdRight} ${styles.open}`}>
                        {formatCurrency(charge.open_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* (b) Zahlungshistorie */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Zahlungshistorie</h2>

          {paymentsError ? (
            <div className={styles.error}>
              Die Zahlungshistorie konnte nicht geladen werden:{" "}
              {paymentsError.message}
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className={styles.empty}>
              Es wurden noch keine Zahlungen erfasst.
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thLeft}>Wertstellung</th>
                    <th className={styles.thRight}>Betrag</th>
                    <th className={styles.thLeft}>Zahler</th>
                    <th className={styles.thLeft}>Verwendungszweck</th>
                    <th className={styles.thLeft}>Notiz</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className={styles.tdLeft}>
                        {formatDate(payment.value_date)}
                      </td>
                      <td className={`${styles.tdRight} ${styles.paid}`}>
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className={styles.tdLeft}>
                        {PAYER_LABELS[payment.payer] ?? payment.payer}
                      </td>
                      <td className={styles.tdLeft}>{payment.purpose || "–"}</td>
                      <td className={styles.tdLeft}>{payment.note || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* (c) Zahlung erfassen */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Zahlung erfassen</h2>
          <div className={styles.formCard}>
            <PaymentForm tenantId={tenantId} />
          </div>
        </section>
      </main>
    </div>
  );
}
