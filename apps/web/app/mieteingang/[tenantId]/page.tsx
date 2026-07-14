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
import { MarkSentButton } from "./MarkSentButton";
import styles from "./detail.module.css";

type PayerType = Database["public"]["Enums"]["payer_type"];
type DunningStatus = Database["public"]["Enums"]["dunning_status"];

const PAYER_LABELS: Record<PayerType, string> = {
  tenant: "Mieter",
  jobcenter: "Jobcenter",
  other: "Sonstige",
};

const DUNNING_STATUS: Record<
  DunningStatus,
  { label: string; className: string }
> = {
  draft: { label: "Entwurf", className: "statusDraft" },
  sent: { label: "Versendet", className: "statusSent" },
  resolved: { label: "Erledigt", className: "statusResolved" },
  obsolete: { label: "Gegenstandslos", className: "statusObsolete" },
};

const DUNNING_LEVEL_LABELS: Record<number, string> = {
  1: "Stufe 1 – Zahlungserinnerung",
  2: "Stufe 2 – Mahnung",
  3: "Stufe 3 – Letzte Mahnung",
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
    <div className={styles.container}>
      <SiteHeader />

      <main className={styles.main}>
        <div className={styles.breadcrumb}>
          <Link href="/mieteingang" className={styles.backLink}>
            ← Zurück zur Übersicht
          </Link>
        </div>

        <div className={styles.headRow}>
          <div>
            <h1 className={styles.title}>{tenantName}</h1>
            <p className={styles.subtitle}>
              Offene Monate, Zahlungshistorie und Zahlungserfassung.
            </p>
          </div>
          {totalOpen > 0 ? (
            <Link
              href={`/mieteingang/${tenantId}/mahnung`}
              className={styles.dunningButton}
            >
              Mahnung erstellen
            </Link>
          ) : null}
        </div>

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
                        {formatMonth(charge.period)}
                      </td>
                      <td className={styles.tdLeft}>
                        {formatDate(charge.due_date)}
                      </td>
                      <td className={styles.tdRight}>
                        {formatCurrency(charge.total_amount)}
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
                        {formatDate(payment.paid_at)}
                      </td>
                      <td
                        className={`${styles.tdRight} ${
                          payment.amount < 0 ? styles.open : styles.paid
                        }`}
                      >
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className={styles.tdLeft}>
                        {PAYER_LABELS[payment.payer] ?? payment.payer}
                      </td>
                      <td className={styles.tdLeft}>
                        {payment.bank_reference || "–"}
                      </td>
                      <td className={styles.tdLeft}>{payment.notes || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* (c) Mahnhistorie */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Mahnhistorie</h2>

          {dunningError ? (
            <div className={styles.error}>
              Die Mahnhistorie konnte nicht geladen werden: {dunningError.message}
            </div>
          ) : !dunningLetters || dunningLetters.length === 0 ? (
            <div className={styles.empty}>
              Es wurden noch keine Mahnungen erstellt.
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thLeft}>Stufe</th>
                    <th className={styles.thLeft}>Datum</th>
                    <th className={styles.thRight}>Betrag</th>
                    <th className={styles.thLeft}>Status</th>
                    <th className={styles.thLeft}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {dunningLetters.map((letter) => {
                    const status = DUNNING_STATUS[letter.status];
                    return (
                      <tr key={letter.id}>
                        <td className={styles.tdLeft}>
                          {DUNNING_LEVEL_LABELS[letter.level] ??
                            `Stufe ${letter.level}`}
                        </td>
                        <td className={styles.tdLeft}>
                          {formatDate(letter.issued_at)}
                        </td>
                        <td className={styles.tdRight}>
                          {formatCurrency(letter.amount_due + letter.fee)}
                        </td>
                        <td className={styles.tdLeft}>
                          <span
                            className={`${styles.statusBadge} ${
                              styles[status.className]
                            }`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className={styles.tdLeft}>
                          <div className={styles.historyActions}>
                            <a
                              href={downloadUrls.get(letter.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.linkBtn}
                            >
                              PDF
                            </a>
                            {letter.status === "draft" ? (
                              <MarkSentButton
                                dunningId={letter.id}
                                tenantId={tenantId}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* (d) Zahlung erfassen */}
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
