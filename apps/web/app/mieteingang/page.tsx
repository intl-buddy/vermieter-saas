import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { formatCurrency } from "../../lib/format";
import { SiteHeader } from "../components/SiteHeader";
import styles from "./mieteingang.module.css";

export const metadata = {
  title: "Mieteingang · Vermieter SaaS",
};

/** Baut den Anzeigenamen eines Mieters aus Vor- und Nachname. */
function tenantName(
  firstName: string | null,
  lastName: string | null,
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || "Unbenannter Mieter";
}

export default async function MieteingangPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zusätzliche Absicherung zur Middleware.
  if (!user) {
    redirect("/login");
  }

  const { data: balances, error } = await supabase
    .from("tenant_balances")
    .select("tenant_id, first_name, last_name, total_charged, total_paid, balance")
    .order("balance", { ascending: false });

  return (
    <div className={styles.container}>
      <SiteHeader />

      <main className={styles.main}>
        <div className={styles.headline}>
          <h1 className={styles.title}>Mieteingangskontrolle</h1>
          <p className={styles.subtitle}>
            Übersicht aller Mietverhältnisse mit Soll, Ist und Saldo. Ein
            positiver Saldo bedeutet einen offenen Rückstand.
          </p>
        </div>

        {error ? (
          <div className={styles.error}>
            Die Mietverhältnisse konnten nicht geladen werden: {error.message}
          </div>
        ) : !balances || balances.length === 0 ? (
          <div className={styles.empty}>
            Es sind noch keine Mietverhältnisse vorhanden.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thLeft}>Mieter</th>
                  <th className={styles.thRight}>Soll gesamt</th>
                  <th className={styles.thRight}>Ist gesamt</th>
                  <th className={styles.thRight}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((row) => {
                  const isArrears = row.balance > 0;
                  return (
                    <tr key={row.tenant_id} className={styles.row}>
                      <td className={styles.tdLeft}>
                        <Link
                          href={`/mieteingang/${row.tenant_id}`}
                          className={styles.rowLink}
                        >
                          {tenantName(row.first_name, row.last_name)}
                        </Link>
                      </td>
                      <td className={styles.tdRight}>
                        {formatCurrency(row.total_charged)}
                      </td>
                      <td className={styles.tdRight}>
                        {formatCurrency(row.total_paid)}
                      </td>
                      <td
                        className={`${styles.tdRight} ${
                          isArrears ? styles.arrears : styles.settled
                        }`}
                      >
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
