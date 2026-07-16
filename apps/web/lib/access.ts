import { canWrite, getAccessStatus, type AccessStatus } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseServerClient } from "@/lib/supabase/server";

/** Fehlermeldung/Tooltip im Lesemodus. */
export const READONLY_WRITE_ERROR =
  "Nur mit aktivem Abo möglich. Reaktiviere dein Abo, um wieder zu bearbeiten.";

/** Zugriffsstatus des eingeloggten Nutzers (oder 'locked', wenn unbekannt). */
export async function getUserAccessStatus(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<AccessStatus> {
  const { data } = await supabase
    .from("users")
    .select("subscription_status, trial_ends_at, current_period_end, access_until")
    .eq("id", userId)
    .maybeSingle();
  return data ? getAccessStatus(data) : "locked";
}

/**
 * Prüft mit vorhandenem Client, ob der Nutzer schreiben darf.
 * Gibt die Fehlermeldung zurück (für `return { error }`) oder null.
 */
export async function assertWriteAccess(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<string | null> {
  const status = await getUserAccessStatus(supabase, userId);
  return canWrite(status) ? null : READONLY_WRITE_ERROR;
}

export type WriteGuard = { userId: string } | { error: string };

/**
 * Authentifiziert den Nutzer UND stellt Schreibrechte sicher (aktives Abo oder
 * Testzeitraum). Ersatz für einfache `requireUserId`-Guards in Schreib-Actions.
 */
export async function requireWriteAccess(): Promise<WriteGuard> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };

  const error = await assertWriteAccess(supabase, user.id);
  if (error) return { error };
  return { userId: user.id };
}
