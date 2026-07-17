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

// ---- Umsatz-Kennzahlen (MRR/ARR) ------------------------------------------

/** USt-Divisor (19 %) für die Netto-Umrechnung. */
export const VAT_DIVISOR = 1.19;

/** Roh-Zählung je price_id aus admin_revenue_stats(). */
export interface RevenueSubRow {
  priceId: string | null;
  subs: number;
  canceling: number;
}

/**
 * Preisinfo je Stripe-price_id, aus PLANS + Env aufgebaut. `grossPrice` ist der
 * abgerechnete Bruttobetrag für das Intervall (Monatspreis bzw. Jahres-Gesamt);
 * die Umrechnung auf den Monatsbeitrag (Jahr /12) macht computeRevenue.
 */
export interface PlanPrice {
  planKey: string;
  planName: string;
  interval: "monthly" | "yearly";
  grossPrice: number;
}

export type PriceMap = Record<string, PlanPrice>;

export interface PlanRevenue {
  planKey: string;
  planName: string;
  /** Anzahl monatlich abgerechneter Abos. */
  monthly: number;
  /** Anzahl jährlich abgerechneter Abos. */
  yearly: number;
  /** MRR-Anteil dieses Plans (brutto). */
  mrr: number;
}

export interface RevenueStats {
  mrrGross: number;
  mrrNet: number;
  arrGross: number;
  /** Anzahl aktiver Abos mit cancel_at_period_end = true (auslaufend). */
  churn: number;
  byPlan: PlanRevenue[];
  /** Aktive Abos, deren price_id sich nicht auf einen Plan abbilden ließ. */
  unmapped: number;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Monatsbeitrag (brutto) einer Preisinfo – Jahresabos werden durch 12 geteilt. */
export function monthlyGrossOf(price: PlanPrice): number {
  return price.interval === "yearly" ? price.grossPrice / 12 : price.grossPrice;
}

/**
 * Berechnet MRR/ARR und die Aufschlüsselung je Plan aus den Roh-Zählungen und
 * dem Preis-Mapping. Gekündigte-aber-laufende Abos sind in `subs` enthalten und
 * zählen voll zum MRR; ihre Anzahl steht zusätzlich in `churn`.
 */
export function computeRevenue(
  rows: RevenueSubRow[],
  priceMap: PriceMap,
): RevenueStats {
  const byPlan = new Map<string, PlanRevenue>();
  let mrrGross = 0;
  let churn = 0;
  let unmapped = 0;

  for (const row of rows) {
    churn += row.canceling;
    const price = row.priceId ? priceMap[row.priceId] : undefined;
    if (!price) {
      unmapped += row.subs;
      continue;
    }
    const monthly = monthlyGrossOf(price);
    const contribution = monthly * row.subs;
    mrrGross += contribution;

    const entry =
      byPlan.get(price.planKey) ??
      ({
        planKey: price.planKey,
        planName: price.planName,
        monthly: 0,
        yearly: 0,
        mrr: 0,
      } satisfies PlanRevenue);
    if (price.interval === "yearly") entry.yearly += row.subs;
    else entry.monthly += row.subs;
    entry.mrr += contribution;
    byPlan.set(price.planKey, entry);
  }

  mrrGross = round2(mrrGross);
  const plans = [...byPlan.values()]
    .map((p) => ({ ...p, mrr: round2(p.mrr) }))
    .sort((a, b) => b.mrr - a.mrr);

  return {
    mrrGross,
    mrrNet: round2(mrrGross / VAT_DIVISOR),
    arrGross: round2(mrrGross * 12),
    churn,
    byPlan: plans,
    unmapped,
  };
}

// ---- Analytics: Funnel, Feature-Nutzung, Verlauf, Portfolio ---------------

/** Anteil in Prozent (auf 1 Stelle), 0 bei fehlender Grundgesamtheit. */
export function percentage(part: number, total: number): number {
  if (!(total > 0)) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export type PortfolioBucket = "0" | "1-3" | "4-5" | "6-10" | "11-20" | "21+";

/** Ordnet eine Einheitenzahl dem Portfolio-Bucket zu (Paketgrenzen). */
export function portfolioBucket(units: number): PortfolioBucket {
  if (units <= 0) return "0";
  if (units <= 3) return "1-3";
  if (units <= 5) return "4-5";
  if (units <= 10) return "6-10";
  if (units <= 20) return "11-20";
  return "21+";
}

/** Reihenfolge + Paket-Hinweis je Bucket (für die Achse). */
export const PORTFOLIO_BUCKETS: { bucket: PortfolioBucket; plan: string }[] = [
  { bucket: "0", plan: "kein Objekt" },
  { bucket: "1-3", plan: "Bronze" },
  { bucket: "4-5", plan: "Silber" },
  { bucket: "6-10", plan: "Gold" },
  { bucket: "11-20", plan: "Platin" },
  { bucket: "21+", plan: "Enterprise" },
];

export interface WeeklyRegistration {
  weekStart: string;
  count: number;
}

export interface FunnelStats {
  usersTotal: number;
  usersWithObject: number;
  usersWithActiveTenancy: number;
  onboardingCompleted: number;
  usersWithSub: number;
  avgTrialToPaidDays: number | null;
  registrationsWeekly: WeeklyRegistration[];
}

export interface FeatureCount {
  total: number;
  last30: number;
}

export interface FeatureUsage {
  dunnings: FeatureCount;
  billingRuns: FeatureCount;
  protocols: FeatureCount;
  receipts: FeatureCount;
  tasks: FeatureCount;
}

export interface MetricsPoint {
  snapshotDate: string;
  mrrGross: number;
  usersTotal: number;
  usersActiveSub: number;
}

export interface PortfolioRow {
  bucket: string;
  count: number;
}

export function parseFunnelStats(value: unknown): FunnelStats {
  const o = (value ?? {}) as Record<string, unknown>;
  const avg = o.avg_trial_to_paid_days;
  const weekly = Array.isArray(o.registrations_weekly)
    ? o.registrations_weekly
    : [];
  return {
    usersTotal: num(o.users_total),
    usersWithObject: num(o.users_with_object),
    usersWithActiveTenancy: num(o.users_with_active_tenancy),
    onboardingCompleted: num(o.onboarding_completed),
    usersWithSub: num(o.users_with_sub),
    avgTrialToPaidDays:
      avg === null || avg === undefined || avg === "" ? null : num(avg),
    registrationsWeekly: weekly.map((w) => {
      const wo = (w ?? {}) as Record<string, unknown>;
      return {
        weekStart: typeof wo.week_start === "string" ? wo.week_start : "",
        count: num(wo.count),
      };
    }),
  };
}

function featureCount(value: unknown): FeatureCount {
  const o = (value ?? {}) as Record<string, unknown>;
  return { total: num(o.total), last30: num(o.last_30) };
}

export function parseFeatureUsage(value: unknown): FeatureUsage {
  const o = (value ?? {}) as Record<string, unknown>;
  return {
    dunnings: featureCount(o.dunnings),
    billingRuns: featureCount(o.billing_runs),
    protocols: featureCount(o.protocols),
    receipts: featureCount(o.receipts),
    tasks: featureCount(o.tasks),
  };
}

export function parseMetricsHistory(value: unknown): MetricsPoint[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const o = (row ?? {}) as Record<string, unknown>;
    return {
      snapshotDate: typeof o.snapshot_date === "string" ? o.snapshot_date : "",
      mrrGross: num(o.mrr_gross),
      usersTotal: num(o.users_total),
      usersActiveSub: num(o.users_active_sub),
    };
  });
}

export function parsePortfolio(value: unknown): PortfolioRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const o = (row ?? {}) as Record<string, unknown>;
    return {
      bucket: typeof o.bucket === "string" ? o.bucket : "",
      count: num(o.count),
    };
  });
}

/** Parst die JSON-Rohdaten von admin_revenue_stats() defensiv. */
export function parseRevenueRows(value: unknown): RevenueSubRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const o = (row ?? {}) as Record<string, unknown>;
    return {
      priceId: typeof o.price_id === "string" ? o.price_id : null,
      subs: num(o.subs),
      canceling: num(o.canceling),
    };
  });
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
