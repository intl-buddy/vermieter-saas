// ============================================================================
// Konto-Verknüpfung – reine, testbare Zugriffslogik.
//
// Spiegelt die Semantik der SQL-Funktion `has_account_access` (Migration 023)
// und der Kontext-Auflösung im Web-Layer wider, damit die Kern-Invarianten
// framework- und DB-frei getestet werden können:
//   * Fremder ohne Link sieht nichts.
//   * Ein aufgehobener (revoked) Link sperrt sofort.
//   * Ein Manager mit aktivem Link darf lesen UND schreiben.
//   * Tickets bleiben privat (nicht Teil der geteilten Tabellen).
// ============================================================================

/** Minimaler Ausschnitt eines account_links-Eintrags für die Zugriffsprüfung. */
export interface AccountLinkLike {
  owner_user_id: string;
  manager_user_id: string | null;
  status: "active" | "revoked";
}

/**
 * true, wenn `authUid` auf die Daten von `targetUserId` zugreifen darf:
 * entweder ist er selbst der Owner, oder es existiert ein AKTIVER Link, der
 * ihn als Manager dieses Owners ausweist. Entspricht `has_account_access`.
 */
export function hasAccountAccess(
  authUid: string,
  targetUserId: string,
  links: AccountLinkLike[],
): boolean {
  if (authUid === targetUserId) return true;
  return links.some(
    (l) =>
      l.owner_user_id === targetUserId &&
      l.manager_user_id === authUid &&
      l.status === "active",
  );
}

export interface ResolvedContext {
  /** Konto, dessen Daten gezeigt/bearbeitet werden. */
  effectiveUserId: string;
  /** true, wenn gerade ein fremdes (Owner-)Konto verwaltet wird. */
  isManaging: boolean;
}

/**
 * Löst das effektiv aktive Konto auf. Das gewünschte Owner-Konto (aus dem
 * Kontext-Cookie) wird NUR akzeptiert, wenn ein gültiger aktiver Link es deckt –
 * andernfalls fällt der Kontext still auf das eigene Konto zurück.
 */
export function resolveEffectiveOwner(
  authUid: string,
  requestedOwnerId: string | null | undefined,
  links: AccountLinkLike[],
): ResolvedContext {
  if (
    requestedOwnerId &&
    requestedOwnerId !== authUid &&
    hasAccountAccess(authUid, requestedOwnerId, links)
  ) {
    return { effectiveUserId: requestedOwnerId, isManaging: true };
  }
  return { effectiveUserId: authUid, isManaging: false };
}

/**
 * Nutzerbezogene Tabellen, deren RLS auf `has_account_access(user_id)` umgestellt
 * ist – der Manager darf sie im Owner-Konto lesen und schreiben.
 */
export const ACCOUNT_SHARED_TABLES = [
  "properties",
  "units",
  "tenants",
  "task_templates",
  "generated_tasks",
  "operating_costs_records",
  "rent_charges",
  "rent_payments",
  "dunning_letters",
  "tenant_person_periods",
  "billing_runs",
  "billing_statements",
  "handover_protocols",
] as const;

/**
 * Bewusst NICHT geteilt: Support-Tickets und ihre Nachrichten bleiben privat
 * (Owner-only), auch für verknüpfte Hausverwaltungen.
 */
export const ACCOUNT_PRIVATE_TABLES = [
  "support_tickets",
  "ticket_messages",
] as const;
