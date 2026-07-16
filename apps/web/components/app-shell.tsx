import Link from "next/link";
import { getAccessStatus, trialDaysRemaining } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenu } from "@/components/user-menu";

/**
 * Grundgerüst für eingeloggte Seiten: schlanke Topbar oben, fixierte
 * Bottom-Bar unten (auf allen Geräten), Inhalt dazwischen mit ausreichend
 * Innenabstand, damit die Leisten nichts verdecken. Zeigt im Testzeitraum
 * dezent einen Hinweis mit Upgrade-Link.
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
  const trialDays = await getTrialDaysLeft();

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
            <UserMenu email={userEmail} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-[76px] pb-[calc(92px+env(safe-area-inset-bottom))]">
        {trialDays !== null ? (
          <Link
            href="/preise"
            className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-gold-100"
          >
            <span>
              Noch{" "}
              <strong className="font-semibold">
                {trialDays} {trialDays === 1 ? "Tag" : "Tage"}
              </strong>{" "}
              Testzeitraum
            </span>
            <span className="shrink-0 font-semibold text-gold-800 underline">
              Jetzt upgraden
            </span>
          </Link>
        ) : null}
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

/**
 * Verbleibende Trial-Tage – oder null, wenn der Nutzer kein aktiver Trial ist
 * (aktives Abo bzw. gesperrt). Fehler werden geschluckt: der Hinweis ist
 * optional und darf keine Seite blockieren.
 */
async function getTrialDaysLeft(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("subscription_status, trial_ends_at, current_period_end")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile) return null;

    if (getAccessStatus(profile) !== "trial") return null;
    return trialDaysRemaining(profile.trial_ends_at);
  } catch {
    return null;
  }
}
