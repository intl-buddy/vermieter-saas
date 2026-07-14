import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { SiteHeader } from "../components/SiteHeader";
import { EinstellungenForm } from "./EinstellungenForm";
import styles from "./einstellungen.module.css";

export const metadata = {
  title: "Einstellungen · Vermieter SaaS",
};

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zusätzliche Absicherung zur Middleware.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select(
      "full_name, company_name, address_street, address_zip, address_city, phone, iban, bank_name, bic, dunning_fee, dunning_deadline_days",
    )
    .eq("id", user.id)
    .maybeSingle();

  // Fallback, falls der Profil-Datensatz (noch) fehlt.
  const values = {
    full_name: profile?.full_name ?? "",
    company_name: profile?.company_name ?? null,
    address_street: profile?.address_street ?? null,
    address_zip: profile?.address_zip ?? null,
    address_city: profile?.address_city ?? null,
    phone: profile?.phone ?? null,
    iban: profile?.iban ?? null,
    bank_name: profile?.bank_name ?? null,
    bic: profile?.bic ?? null,
    dunning_fee: profile?.dunning_fee ?? 0,
    dunning_deadline_days: profile?.dunning_deadline_days ?? 14,
  };

  return (
    <div className={styles.container}>
      <SiteHeader />

      <main className={styles.main}>
        <h1 className={styles.title}>Einstellungen</h1>
        <p className={styles.subtitle}>Dein Vermieter-Profil.</p>

        <p className={styles.hint}>
          Diese Angaben erscheinen als Absender auf deinen Mahnschreiben.
        </p>

        <EinstellungenForm profile={values} />
      </main>
    </div>
  );
}
