import { DELETION_GRACE_DAYS } from "./plans";

/**
 * Reine Entscheidungslogik für die Selbstlöschung des Kontos.
 *
 * Die Nebenwirkungen (Storage/Stripe/Auth löschen, Mails) liegen in
 * `apps/web/lib/lifecycle.ts`; hier steht nur die testbare Logik, WANN gelöscht
 * bzw. abgebrochen wird. Die Karenz ist dieselbe wie bei der Lesefrist-Löschung
 * (`DELETION_GRACE_DAYS`, 7 Tage).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Karenzfrist der Selbstlöschung in Tagen (identisch zur Lesefrist-Karenz). */
export const SELF_DELETION_GRACE_DAYS = DELETION_GRACE_DAYS;

/**
 * Hat der Nutzer eine Löschung vorgemerkt? Grundlage für den Login-Abbruch:
 * Ist das Feld gesetzt, wird es beim nächsten erfolgreichen Login geleert.
 */
export function isDeletionPending(
  deletionRequestedAt: string | null | undefined,
): boolean {
  return Boolean(deletionRequestedAt);
}

/**
 * Liegt ein Auslöse-Zeitpunkt weiter als die Karenz zurück? `null` (kein
 * Auslöser gesetzt) ergibt immer `false`.
 */
export function isPastGrace(
  triggerIso: string | null | undefined,
  now: Date,
  graceDays: number = DELETION_GRACE_DAYS,
): boolean {
  if (!triggerIso) return false;
  const cutoff = now.getTime() - graceDays * DAY_MS;
  return new Date(triggerIso).getTime() < cutoff;
}

export interface DeletionCandidate {
  /** Ende der Lesefrist (Lesemodus-Löschung). */
  access_until: string | null;
  /** Zeitpunkt der selbst angeforderten Löschung. */
  deletion_requested_at: string | null;
}

/**
 * Ist der Nutzer endgültig zu löschen? Wahr, sobald EINER der beiden Auslöser
 * – Ende der Lesefrist ODER Selbstlöschung – länger als die Karenz zurückliegt.
 * Ein aktives Abo verhindert die Löschung NICHT (die Selbstlöschung ist
 * ausdrücklich gewollt; das Abo wird im Zuge der Löschung bei Stripe gekündigt).
 */
export function isDueForDeletion(
  user: DeletionCandidate,
  now: Date,
  graceDays: number = DELETION_GRACE_DAYS,
): boolean {
  return (
    isPastGrace(user.access_until, now, graceDays) ||
    isPastGrace(user.deletion_requested_at, now, graceDays)
  );
}

/**
 * Löschzeitpunkt (Auslöser + Karenz) – für die Anzeige in Dialog, Abschiedsseite
 * und Bestätigungsmail.
 */
export function scheduledDeletionDate(
  triggerIso: string,
  graceDays: number = DELETION_GRACE_DAYS,
): Date {
  return new Date(new Date(triggerIso).getTime() + graceDays * DAY_MS);
}

/**
 * Stripe-Aufräumplan bei der Löschung: Ist ein Stripe-Customer hinterlegt, wird
 * er gelöscht – das kündigt zugleich ein etwaiges aktives Abo bei Stripe.
 */
export function planStripeCleanup(user: {
  stripe_customer_id: string | null | undefined;
}): { deleteCustomer: boolean } {
  return { deleteCustomer: Boolean(user.stripe_customer_id) };
}
