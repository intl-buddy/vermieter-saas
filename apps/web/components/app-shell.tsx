import Link from "next/link";
import {
  getAccessStatus,
  trialDaysRemaining,
  type AccessStatus,
} from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenu } from "@/components/user-menu";

/**
 * Grundgerüst für eingeloggte Seiten: schlanke Topbar oben, fixierte
 * Bottom-Bar unten (auf allen Geräten), Inhalt dazwischen mit ausreichend
 * Innenabstand. Zeigt oben – je nach Zugriffsstatus – dezent einen
 * Trial-Hinweis oder (im Lesemodus) das Löschbanner.
 */
export async function AppShell({
  title,
  userEmail,
  children,
}: {
  title: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const [access, isAdmin] = await Promise.all([
    getAccessSummary(),
    getIsAdmin(),
  ]);

  return (
    <div className="min-h-dvh">
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-4xl items-center gap-3 px-4">
          <span className="text-lg font-extrabold tracking-tight text-secondary">
            tefter
            <span
              className="ml-0.5 inline-block size-1.5 rounded-full bg-gold-500 align-baseline"
              aria-hidden
            />
          </span>
          {title ? (
            <>
              <span className="h-4 w-px bg-neutral-200" aria-hidden />
              <span className="truncate text-sm font-medium text-neutral-600">
                {title}
              </span>
            </>
          ) : null}
          <div className="ml-auto">
            <UserMenu email={userEmail} isAdmin={isAdmin} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-[76px] pb-[calc(92px+env(safe-area-inset-bottom))]">
        {access?.status === "trial" ? (
          <Link
            href="/preise"
            className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-gold-100"
          >
            <span>
              Noch{" "}
              <strong className="font-semibold">
                {access.trialDays} {access.trialDays === 1 ? "Tag" : "Tage"}
              </strong>{" "}
              Testzeitraum
            </span>
            <span className="shrink-0 font-semibold text-gold-800 underline">
              Jetzt upgraden
            </span>
          </Link>
        ) : null}

        {access?.status === "readonly" ? (
          <div className="mb-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800">
            <p className="font-semibold">Dein Abo ist beendet – Lesemodus aktiv.</p>
            <p className="mt-0.5 text-danger-700">
              Du hast Lesezugriff
              {access.accessUntil ? ` bis ${formatDate(access.accessUntil)}` : ""} –
              danach werden deine Daten gelöscht. Bearbeiten ist nur mit aktivem
              Abo möglich.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href="/preise"
                className="rounded-md bg-danger-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger-700"
              >
                Abo reaktivieren
              </Link>
              <a
                href="/api/datenexport"
                className="rounded-md border border-danger-300 bg-white px-3 py-1.5 text-xs font-semibold text-danger-700 hover:bg-danger-100"
              >
                Daten exportieren
              </a>
            </div>
          </div>
        ) : null}

        {children}
      </main>

      <BottomNav />
    </div>
  );
}

interface AccessSummary {
  status: AccessStatus;
  trialDays: number;
  accessUntil: string | null;
}

/**
 * Zugriffsstatus des eingeloggten Nutzers für die Banner-Anzeige. Fehler werden
 * geschluckt: die Banner sind optional und dürfen keine Seite blockieren.
 */
async function getAccessSummary(): Promise<AccessSummary | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select(
        "subscription_status, trial_ends_at, current_period_end, subscription_id, cancel_at_period_end, access_until",
      )
      .eq("id", user.id)
      .maybeSingle();
    if (!profile) return null;

    return {
      status: getAccessStatus(profile),
      trialDays: trialDaysRemaining(profile.trial_ends_at),
      accessUntil: profile.access_until,
    };
  } catch {
    return null;
  }
}

/**
 * Ist der eingeloggte Nutzer Admin? Bewusst eine EIGENE Abfrage (nur die
 * is_admin-Spalte), damit ein fehlendes/verändertes Feld niemals die
 * Zugriffs-Banner mitreißt. Fehler → false (der Eintrag erscheint dann nicht).
 */
async function getIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    return data?.is_admin === true;
  } catch {
    return false;
  }
}
