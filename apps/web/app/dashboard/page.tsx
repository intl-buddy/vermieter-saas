import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { logout } from "../actions";
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
      <header className={styles.header}>
        <span className={styles.brand}>Vermieter&nbsp;SaaS</span>
        <form action={logout}>
          <button type="submit" className={styles.logout}>
            Abmelden
          </button>
        </form>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Willkommen, {user.email}</h1>
        <p className={styles.text}>
          Du bist erfolgreich angemeldet. Hier entsteht dein Dashboard.
        </p>
      </main>
    </div>
  );
}
