// ============================================================================
// Admin-Dashboard – Typen & reine Hilfslogik (framework-frei, testbar).
// Die Aggregate liefern die SECURITY-DEFINER-Funktionen admin_stats() /
// admin_stats_by_city() als JSON; hier nur Parsing, Normalisierung, Kennzahlen.
// ============================================================================

export interface AdminStats {
  usersTotal: number;
  usersTrial: number;
  usersActive: number;
  usersReadonly: number;
  usersLast7: number;
  usersLast30: number;
  propertiesTotal: number;
  unitsTotal: number;
  activeTenancies: number;
  sumColdRent: number;
  sumPrepayments: number;
}

export interface CityStats {
  city: string;
  properties: number;
  units: number;
  activeTenancies: number;
  /** Ø Kaltmiete €/m² – null, wenn keine belegte Fläche vorhanden. */
  avgRentPerSqm: number | null;
}

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

/**
 * Normalisiert einen Städtenamen für die Anzeige: trimmt, vereinheitlicht
 * Mehrfach-Leerzeichen und die Groß-/Kleinschreibung (Title Case). Leere
 * Angaben werden zu „Ohne Angabe". Idempotent zur SQL-Normalisierung
 * (initcap(btrim(city))).
 */
export function normalizeCity(city: string | null | undefined): string {
  const trimmed = (city ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Ohne Angabe";
  return trimmed
    .split(" ")
    .map((w) =>
      w.length === 0 ? w : w[0]!.toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");
}

/**
 * Ø Kaltmiete pro m²: Summe der Kaltmieten / Summe der Wohnflächen. Gibt null
 * zurück, wenn keine (positive) Fläche vorliegt – nie eine Division durch 0.
 */
export function avgRentPerSqm(
  sumColdRent: number,
  sumLivingArea: number,
): number | null {
  if (!(sumLivingArea > 0)) return null;
  return Math.round((sumColdRent / sumLivingArea) * 100) / 100;
}

export function parseAdminStats(value: unknown): AdminStats {
  const o = (value ?? {}) as Record<string, unknown>;
  return {
    usersTotal: num(o.users_total),
    usersTrial: num(o.users_trial),
    usersActive: num(o.users_active),
    usersReadonly: num(o.users_readonly),
    usersLast7: num(o.users_last_7),
    usersLast30: num(o.users_last_30),
    propertiesTotal: num(o.properties_total),
    unitsTotal: num(o.units_total),
    activeTenancies: num(o.active_tenancies),
    sumColdRent: num(o.sum_cold_rent),
    sumPrepayments: num(o.sum_prepayments),
  };
}

export function parseCityStats(value: unknown): CityStats[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const o = (row ?? {}) as Record<string, unknown>;
    const avg = o.avg_rent_per_sqm;
    return {
      city: normalizeCity(typeof o.city === "string" ? o.city : ""),
      properties: num(o.properties),
      units: num(o.units),
      activeTenancies: num(o.active_tenancies),
      avgRentPerSqm:
        avg === null || avg === undefined || avg === "" ? null : num(avg),
    };
  });
}
