/**
 * Parsing-Hilfen für Formulareingaben. Akzeptiert deutsche Zahlenschreibweise
 * (Dezimalkomma, Tausenderpunkte) und reine Punkt-Notation aus
 * `<input type="number">`.
 */

/**
 * Wandelt eine Eingabe in eine Dezimalzahl um.
 * - Leerer String → `null` (Feld nicht ausgefüllt).
 * - Ungültige Eingabe → `NaN` (vom Aufrufer via `Number.isNaN` zu prüfen).
 */
export function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  return Number(normalized);
}

/**
 * Wandelt eine Eingabe in eine Ganzzahl um.
 * - Leerer String → `null`.
 * - Nicht-ganzzahlige/ungültige Eingabe → `NaN`.
 */
export function parseIntStrict(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isInteger(value) ? value : NaN;
}
