export const INTERVAL_OPTIONS: { value: string; label: string }[] = [
  { value: "monthly", label: "Monatlich" },
  { value: "quarterly", label: "Vierteljährlich" },
  { value: "semiannually", label: "Halbjährlich" },
  { value: "yearly", label: "Jährlich" },
];

export const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

/** Lesbare Formatierung eines Vorlagen-Intervalls, z. B. „Monatlich am 1." */
export function formatInterval(t: {
  interval: string;
  day_of_month: number | null;
  month_of_year: number | null;
}): string {
  const day = t.day_of_month ?? 1;
  const anchor =
    t.month_of_year && t.month_of_year >= 1 && t.month_of_year <= 12
      ? MONTHS[t.month_of_year - 1]
      : null;

  switch (t.interval) {
    case "monthly":
      return `Monatlich am ${day}.`;
    case "quarterly":
      return `Vierteljährlich am ${day}.${anchor ? ` (ab ${anchor})` : ""}`;
    case "semiannually":
      return `Halbjährlich am ${day}.${anchor ? ` (ab ${anchor})` : ""}`;
    case "yearly":
      return `Jährlich am ${day}.${t.month_of_year ?? ""}.`;
    case "weekly":
      return "Wöchentlich";
    case "once":
      return "Einmalig";
    default:
      return t.interval;
  }
}
