import type { User } from "@supabase/supabase-js";
import type { SupabaseServerClient } from "./supabase/server";

/**
 * Legt – falls noch nicht vorhanden – den passenden Eintrag in `public.users`
 * an. Die Zeile wird als eingeloggter Nutzer geschrieben, damit die RLS-Policy
 * `users_self` (id = auth.uid()) greift. `full_name` kommt aus den bei der
 * Registrierung gespeicherten User-Metadaten.
 */
export async function ensureUserRecord(
  supabase: SupabaseServerClient,
  user: User,
) {
  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || "";

  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );

  return error;
}

/**
 * Übersetzt die englischen Supabase-Auth-Fehlermeldungen in verständliche
 * deutsche Texte.
 */
export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-Mail-Adresse oder Passwort ist ungültig.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  }
  if (normalized.includes("user already registered")) {
    return "Diese E-Mail-Adresse ist bereits registriert.";
  }
  if (
    normalized.includes("password should be at least") ||
    normalized.includes("password should contain")
  ) {
    return "Das Passwort muss mindestens 6 Zeichen lang sein.";
  }
  if (normalized.includes("unable to validate email address")) {
    return "Bitte gib eine gültige E-Mail-Adresse ein.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Zu viele Versuche. Bitte versuche es später erneut.";
  }

  return "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";
}
