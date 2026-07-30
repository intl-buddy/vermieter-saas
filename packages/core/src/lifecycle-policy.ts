import { getAccessStatus, type AccessInput } from "./plans";

/**
 * Reine, getestete Kandidaten-Logik des täglichen Lebenszyklus-Laufs. Die
 * Nebenwirkungen (DB-Updates, Mails, Stripe, Storage) liegen in
 * `apps/web/lib/lifecycle.ts`; hier steht nur, WER an welchem Schritt teilnimmt.
 * So bleibt `getAccessStatus` die einzige Quelle der Zugriffslogik.
 *
 * Löschkandidaten (Lesefrist- UND Selbstlöschung) siehe `./self-deletion`.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Erinnerungsmails an Lesemodus-Nutzer höchstens alle N Tage. */
export const REMINDER_INTERVAL_DAYS = 30;

/**
 * Soll ein Nutzer in den Lesemodus versetzt werden (access_until setzen)?
 * Kandidat, wenn ohne Lesefrist der Zugriff bereits erloschen wäre ('locked') –
 * also Trial abgelaufen bzw. Abo beendet und keine Kulanz mehr greift.
 */
export function shouldPromoteToReadonly(
  user: AccessInput,
  now: Date = new Date(),
): boolean {
  return getAccessStatus({ ...user, access_until: null }, now) === "locked";
}

/**
 * Ist für einen Lesemodus-Nutzer eine Erinnerungsmail fällig? Nur solange die
 * Lesefrist läuft (access_until in der Zukunft) und die letzte Erinnerung
 * länger als das Intervall zurückliegt bzw. noch nie verschickt wurde.
 */
export function isReminderDue(
  accessUntil: string | null | undefined,
  deletionWarnedAt: string | null | undefined,
  now: Date,
  intervalDays: number = REMINDER_INTERVAL_DAYS,
): boolean {
  if (!accessUntil) return false;
  if (new Date(accessUntil).getTime() <= now.getTime()) return false;
  if (!deletionWarnedAt) return true;
  const cutoff = now.getTime() - intervalDays * DAY_MS;
  return new Date(deletionWarnedAt).getTime() <= cutoff;
}
