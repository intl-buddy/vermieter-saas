import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { SiteHeader } from "../components/SiteHeader";
import { PropertyForm } from "./PropertyForm";
import styles from "./objekte.module.css";

export const metadata = {
  title: "Objekte · Vermieter SaaS",
};

export default async function ObjektePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zusätzliche Absicherung zur Middleware.
  if (!user) {
    redirect("/login");
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      "id, name, street, house_number, zip, city, units(count)",
    )
    .order("name", { ascending: true });

  return (
    <div className={styles.container}>
      <SiteHeader />

      <main className={styles.main}>
        <div className={styles.headline}>
          <h1 className={styles.title}>Objekte</h1>
          <p className={styles.subtitle}>
            Verwalte deine Liegenschaften und ihre Einheiten.
          </p>
        </div>

        <details className={styles.disclosure}>
          <summary className={styles.disclosureSummary}>
            + Neues Objekt anlegen
          </summary>
          <div className={styles.disclosureBody}>
            <PropertyForm mode="create" />
          </div>
        </details>

        {error ? (
          <div className={styles.error}>
            Die Objekte konnten nicht geladen werden: {error.message}
          </div>
        ) : !properties || properties.length === 0 ? (
          <div className={styles.empty}>
            Noch keine Objekte vorhanden. Lege oben dein erstes Objekt an.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thLeft}>Name</th>
                  <th className={styles.thLeft}>Adresse</th>
                  <th className={styles.thRight}>Einheiten</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => {
                  const unitCount = property.units?.[0]?.count ?? 0;
                  return (
                    <tr key={property.id} className={styles.row}>
                      <td className={styles.tdLeft}>
                        <Link
                          href={`/objekte/${property.id}`}
                          className={styles.rowLink}
                        >
                          {property.name}
                        </Link>
                      </td>
                      <td className={styles.tdLeft}>
                        {property.street} {property.house_number}, {property.zip}{" "}
                        {property.city}
                      </td>
                      <td className={styles.tdRight}>{unitCount}</td>
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
