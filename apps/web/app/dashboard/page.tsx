import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { SiteHeader } from "../components/SiteHeader";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zusätzliche Absicherung zur Middleware.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <SiteHeader />

      <main className={styles.main}>
        <h1 className={styles.title}>Willkommen, {user.email}</h1>
        <p className={styles.text}>
          Du bist erfolgreich angemeldet. Hier entsteht dein Dashboard.
        </p>
      </main>
    </div>
  );
}
