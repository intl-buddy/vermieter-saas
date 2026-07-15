"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import { ensureUserRecord, translateAuthError } from "../lib/auth";

export type AuthState = {
  error?: string;
  message?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Zieladresse des Passwort-Zurücksetzen-Links (Produktions-URL). */
const PASSWORD_RESET_REDIRECT = "https://app.tefter.de/passwort-zuruecksetzen";

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

  const supabase = await createClient();
  // Fehler bewusst nicht an den Nutzer weitergeben (keine Existenz-Preisgabe).
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: PASSWORD_RESET_REDIRECT,
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  redirect("/dashboard");
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

  if (!fullName || !email || !password) {
    return { error: "Bitte alle Felder ausfüllen." };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Bitte gib eine gültige E-Mail-Adresse ein." };
  }
  if (password.length < 6) {
    return { error: "Das Passwort muss mindestens 6 Zeichen lang sein." };
  }

  const origin = (await headers()).get("origin") ?? "";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  // Session vorhanden (E-Mail-Bestätigung deaktiviert) → direkt einloggen und
  // public.users-Eintrag anlegen.
  if (data.session && data.user) {
    const insertError = await ensureUserRecord(supabase, data.user);
    if (insertError) {
      return {
        error:
          "Konto erstellt, aber das Profil konnte nicht angelegt werden. Bitte melde dich an.",
      };
    }
    redirect("/dashboard");
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
