import { cookies } from "next/headers";
import type { SupabaseServerClient } from "@/lib/supabase/server";

/**
 * Konto-Kontext für die Hausverwaltungs-Verknüpfung.
 *
 * Ein Manager (z. B. die OA Hausverwaltung) kann über einen aktiven
 * `account_link` im Konto eines Owners arbeiten. Welches Owner-Konto gerade
 * aktiv ist, steht in einem Cookie – dieser wird bei JEDEM Request gegen die
 * tatsächlich vorhandenen, aktiven Links geprüft (`my_managed_accounts`).
 * Ist der Link aufgehoben oder unbekannt, fällt der Kontext still auf das
 * eigene Konto zurück; RLS (`has_account_access`) verweigert dann ohnehin jeden
 * Zugriff auf fremde Daten.
 */

/** Cookie mit der owner_user_id des aktuell verwalteten Kontos. */
export const ACTIVE_ACCOUNT_COOKIE = "tefter_active_owner";

export interface ManagedAccount {
  id: string;
  name: string;
  email: string;
  grantedAt: string;
}

export interface AccountContext {
  /** Der tatsächlich eingeloggte Nutzer. */
  authUserId: string;
  /** Konto, dessen Daten gerade gezeigt/bearbeitet werden (Owner oder man selbst). */
  effectiveUserId: string;
  /** true, wenn gerade ein fremdes Konto verwaltet wird. */
  isManaging: boolean;
  /** Der verwaltete Owner (nur wenn `isManaging`). */
  owner: { id: string; name: string } | null;
  /** Alle Konten, die dieser Nutzer verwalten darf (für den Umschalter). */
  managedAccounts: ManagedAccount[];
}

/**
 * Liste der Konten, die der eingeloggte Nutzer als Manager verwalten darf.
 * Löst dabei serverseitig offene Links per E-Mail-Abgleich auf. Fehler werden
 * geschluckt (der Umschalter ist optional und darf keine Seite blockieren).
 */
export async function listManagedAccounts(
  supabase: SupabaseServerClient,
): Promise<ManagedAccount[]> {
  try {
    const { data, error } = await supabase.rpc("my_managed_accounts");
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.owner_user_id,
      name: row.owner_name || row.owner_email || "Unbenanntes Konto",
      email: row.owner_email,
      grantedAt: row.granted_at,
    }));
  } catch {
    return [];
  }
}

export interface EffectiveContext {
  effectiveUserId: string;
  isManaging: boolean;
  owner: { id: string; name: string } | null;
}

/**
 * Schlanke Kontext-Auflösung für Seiten und Server-Actions: Sie brauchen nur die
 * effektive `user_id`, nicht die volle Kontoliste. Ohne Kontext-Cookie wird der
 * (teure) RPC-Aufruf komplett übersprungen – der Normalfall (eigener Owner).
 */
export async function getEffectiveUserId(
  supabase: SupabaseServerClient,
  authUserId: string,
): Promise<EffectiveContext> {
  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_ACCOUNT_COOKIE)?.value;

  // Kein Kontext gewünscht → eigenes Konto, ohne Auflösung.
  if (!requested || requested === authUserId) {
    return { effectiveUserId: authUserId, isManaging: false, owner: null };
  }

  const managedAccounts = await listManagedAccounts(supabase);
  const owner = managedAccounts.find((a) => a.id === requested) ?? null;
  return {
    effectiveUserId: owner ? owner.id : authUserId,
    isManaging: Boolean(owner),
    owner: owner ? { id: owner.id, name: owner.name } : null,
  };
}

/**
 * Voller Konto-Kontext inkl. Liste der verwaltbaren Konten – für den Umschalter
 * und das Banner in der App-Shell. `authUserId` muss bereits authentifiziert
 * feststehen (aus `supabase.auth.getUser()`).
 */
export async function getAccountContext(
  supabase: SupabaseServerClient,
  authUserId: string,
): Promise<AccountContext> {
  const managedAccounts = await listManagedAccounts(supabase);

  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_ACCOUNT_COOKIE)?.value;
  const owner = requested
    ? (managedAccounts.find((a) => a.id === requested) ?? null)
    : null;

  return {
    authUserId,
    effectiveUserId: owner ? owner.id : authUserId,
    isManaging: Boolean(owner),
    owner: owner ? { id: owner.id, name: owner.name } : null,
    managedAccounts,
  };
}

/**
 * Bequemer Helfer für Server-Actions/Seiten: authentifiziert den Nutzer und
 * gibt direkt den Kontext zurück (oder null, wenn nicht eingeloggt).
 */
export async function resolveAccountContext(
  supabase: SupabaseServerClient,
): Promise<AccountContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getAccountContext(supabase, user.id);
}
