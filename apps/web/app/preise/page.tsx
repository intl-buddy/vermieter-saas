import Link from "next/link";
import { getAccessStatus, type AccessStatus } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { PreiseClient } from "./PreiseClient";

export const metadata = { title: "Preise · tefter" };

export default async function PreisePage({
  searchParams,
}: {
  searchParams: Promise<{ gesperrt?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan: string | null = null;
  let access: AccessStatus | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("plan, subscription_status, trial_ends_at, current_period_end")
      .eq("id", user.id)
      .maybeSingle();
    if (profile) {
      currentPlan = profile.plan;
      access = getAccessStatus(profile);
    }
  }

  const locked = params.gesperrt === "1";
  const canceled = params.checkout === "cancel";

  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link
            href={user ? "/dashboard" : "/"}
            className="text-lg font-extrabold tracking-tight text-secondary"
          >
            tefter
            <span
              className="ml-0.5 inline-block size-1.5 rounded-full bg-gold-500 align-baseline"
              aria-hidden
            />
          </Link>
          <div className="ml-auto text-sm">
            {user ? (
              access === "locked" ? (
                <span className="text-neutral-500">Angemeldet</span>
              ) : (
                <Link href="/dashboard" className="text-secondary hover:underline">
                  Zum Dashboard
                </Link>
              )
            ) : (
              <Link href="/login" className="text-secondary hover:underline">
                Anmelden
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {locked ? (
          <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-gold-300 bg-gold-50 px-5 py-4 text-center text-sm text-neutral-700">
            <p className="font-semibold text-neutral-900">
              Dein Testzeitraum ist abgelaufen.
            </p>
            <p className="mt-1">
              Wähle ein Paket, um tefter weiter zu nutzen. Deine Daten bleiben
              selbstverständlich erhalten.
            </p>
          </div>
        ) : null}
        {canceled ? (
          <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-neutral-200 bg-white px-5 py-4 text-center text-sm text-neutral-600">
            Der Bezahlvorgang wurde abgebrochen – es wurde nichts berechnet.
          </div>
        ) : null}

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Ein Paket für jede Portfoliogröße
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-neutral-600">
            Alle Funktionen in jedem Paket. Der Unterschied liegt allein in der
            Zahl der verwalteten Einheiten. Jederzeit kündbar.
          </p>
        </div>

        <PreiseClient
          isLoggedIn={Boolean(user)}
          currentPlan={currentPlan}
          access={access}
        />
      </main>
    </div>
  );
}
