/**
 * Deutsche Formatierungshilfen (Intl, Gebietsschema `de-DE`).
 * Zentral gehalten, damit Beträge und Datumsangaben überall einheitlich
 * dargestellt werden.
 */

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
});

/**
 * Wandelt einen reinen Datums-String (`YYYY-MM-DD`) in ein `Date` in lokaler
 * Zeit um. So werden Zeitzonen-Verschiebungen vermieden, die bei
 * `new Date("2026-07-14")` (UTC-Mitternacht) entstehen könnten.
 */
function toLocalDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  return new Date(dateOnly.test(value) ? `${value}T00:00:00` : value);
}

/** Formatiert einen Betrag als Euro, z. B. `1.234,50 €`. */
export function formatCurrency(amount: number | null | undefined): string {
  return currencyFormatter.format(amount ?? 0);
}

/** Formatiert ein Datum als `TT.MM.JJJJ`, z. B. `14.07.2026`. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "–";
  return dateFormatter.format(toLocalDate(value));
}

/** Formatiert einen Monat als `Monat JJJJ`, z. B. `Juli 2026`. */
export function formatMonth(value: string | Date | null | undefined): string {
  if (!value) return "–";
  return monthFormatter.format(toLocalDate(value));
}
