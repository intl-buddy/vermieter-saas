"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import { ensureUserRecord, translateAuthError } from "../lib/auth";
import { siteUrlFromHeaders } from "../lib/site-url";

export type AuthState = {
  error?: string;
  message?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fordert eine E-Mail zum Zurücksetzen des Passworts an. Gibt aus
 * Sicherheitsgründen IMMER dieselbe neutrale Meldung zurück – unabhängig davon,
 * ob die Adresse existiert –, damit sich registrierte E-Mails nicht per
 * Formular erraten lassen.
 */
export async function requestPasswordReset(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Bitte gib deine E-Mail-Adresse ein." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Bitte gib eine gültige E-Mail-Adresse ein." };
  }

  // Zieladresse aus NEXT_PUBLIC_SITE_URL (Fallback: Origin der Anfrage) statt
  // fest verdrahtet – sonst zeigt der Link aus der lokalen Umgebung oder einem
  // Preview-Deploy auf die Produktion.
  const base = siteUrlFromHeaders(await headers());

  const supabase = await createClient();
  // Fehler bewusst nicht an den Nutzer weitergeben (keine Existenz-Preisgabe).
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/passwort-zuruecksetzen`,
  });

  return {
    message:
      "Falls ein Konto mit dieser Adresse existiert, haben wir dir einen Link geschickt.",
  };
}

/**
 * Meldet einen bestehenden Nutzer mit E-Mail und Passwort an.
 */
export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Bitte E-Mail-Adresse und Passwort eingeben." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  redirect(await postLoginDestination(supabase, data.user?.id));
}

/**
 * Zielseite nach erfolgreichem Login: neue Nutzer, die das Onboarding noch
 * nicht abgeschlossen haben, werden nach /willkommen geführt (nur direkt nach
 * dem Login – nicht bei jedem Request, damit „Später einrichten" funktioniert).
 */
async function postLoginDestination(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined,
): Promise<string> {
  if (!userId) return "/dashboard";
  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();
  // Fehlt die Zeile noch, ist der Nutzer brandneu → Onboarding.
  return profile?.onboarding_completed ? "/dashboard" : "/willkommen";
}

/**
 * Registriert einen neuen Nutzer und legt – sobald eine Session besteht – den
 * Eintrag in `public.users` an.
 */
export async function register(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const termsAccepted = formData.get("terms") === "on";

  if (!fullName || !email || !password) {
    return { error: "Bitte alle Felder ausfüllen." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Bitte gib eine gültige E-Mail-Adresse ein." };
  }
  if (password.length < 6) {
    return { error: "Das Passwort muss mindestens 6 Zeichen lang sein." };
  }
  if (!termsAccepted) {
    return {
      error:
        "Bitte stimme den AGB, der Datenschutzerklärung und dem AVV zu.",
    };
  }

  // Nicht aus dem rohen origin-Header bauen: Fehlt er oder trägt er die
  // containerinterne Adresse, landete bisher `0.0.0.0:3000` im Bestätigungslink.
  const base = siteUrlFromHeaders(await headers());

  const supabase = await createClient();
  // Zustimmungszeitpunkt in den Metadaten hinterlegen; der handle_new_user-
  // Trigger schreibt ihn beim Anlegen der Zeile nach users.terms_accepted_at.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${base}/auth/callback`,
      data: {
        full_name: fullName,
        terms_accepted_at: new Date().toISOString(),
      },
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // Session vorhanden (E-Mail-Bestätigung deaktiviert) → direkt einloggen und
  // public.users-Eintrag anlegen. Neu registriert → immer ins Onboarding.
  if (data.session && data.user) {
    const insertError = await ensureUserRecord(supabase, data.user);
    if (insertError) {
      return {
        error:
          "Konto erstellt, aber das Profil konnte nicht angelegt werden. Bitte melde dich an.",
      };
    }
    redirect("/willkommen");
  }

  // Keine Session → E-Mail-Bestätigung erforderlich. Der public.users-Eintrag
  // wird nach der Bestätigung in /auth/callback angelegt.
  return {
    message:
      "Fast geschafft! Wir haben dir eine E-Mail zur Bestätigung geschickt. Bitte prüfe dein Postfach.",
  };
}

/**
 * Meldet den aktuellen Nutzer ab.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
