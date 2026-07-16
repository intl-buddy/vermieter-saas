// ============================================================================
// Tarif-Konfiguration & Zugriffs-/Limit-Logik (framework-frei, testbar).
// Die Stripe-Price-IDs kommen aus Env-Vars (STRIPE_PRICE_<PAKET>_<INTERVALL>)
// und werden erst serverseitig aufgelöst – hier stehen nur die Namen.
// ============================================================================

export type PlanKey = "bronze" | "silber" | "gold" | "platin";

export type BillingInterval = "monthly" | "yearly";

/**
 * Zugriffsstatus eines Nutzers für das Gating:
 *  - 'trial'    – Testzeitraum läuft
 *  - 'active'   – aktives (bezahltes) Abo
 *  - 'readonly' – kein aktives Abo, aber Lesezugriff bis `access_until`
 *  - 'locked'   – kein Zugriff mehr (Lesefrist abgelaufen)
 */
export type AccessStatus = "trial" | "active" | "readonly" | "locked";

export interface PlanConfig {
  key: PlanKey;
  /** Anzeigename (Deutsch). */
  name: string;
  /** Maximale Anzahl Einheiten. */
  unitLimit: number;
  /**
   * Bruttopreis pro Monat in EUR bei monatlicher Zahlung.
   * WICHTIG: Diese Werte sind die EINZIGE Anzeige-Quelle und müssen exakt zu
   * den hinterlegten Stripe-Preisen passen (siehe CLAUDE.md).
   */
  priceMonthly: number;
  /** Effektiver Monatspreis in EUR bei jährlicher Zahlung. */
  priceYearlyPerMonth: number;
  /** Jährlich abgerechneter Gesamtbetrag in EUR. */
  priceYearlyTotal: number;
  /** Name der Env-Var mit der monatlichen Stripe-Price-ID. */
  envMonthly: string;
  /** Name der Env-Var mit der jährlichen Stripe-Price-ID. */
  envYearly: string;
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  bronze: {
    key: "bronze",
    name: "Bronze",
    unitLimit: 3,
    priceMonthly: 9.99,
    priceYearlyPerMonth: 7.99,
    priceYearlyTotal: 95.88,
    envMonthly: "STRIPE_PRICE_BRONZE_MONTHLY",
    envYearly: "STRIPE_PRICE_BRONZE_YEARLY",
  },
  silber: {
    key: "silber",
    name: "Silber",
    unitLimit: 5,
    priceMonthly: 15.99,
    priceYearlyPerMonth: 12.99,
    priceYearlyTotal: 155.88,
    envMonthly: "STRIPE_PRICE_SILBER_MONTHLY",
    envYearly: "STRIPE_PRICE_SILBER_YEARLY",
  },
  gold: {
    key: "gold",
    name: "Gold",
    unitLimit: 10,
    priceMonthly: 24.99,
    priceYearlyPerMonth: 19.99,
    priceYearlyTotal: 239.88,
    envMonthly: "STRIPE_PRICE_GOLD_MONTHLY",
    envYearly: "STRIPE_PRICE_GOLD_YEARLY",
  },
  platin: {
    key: "platin",
    name: "Platin",
    unitLimit: 20,
    priceMonthly: 39.99,
    priceYearlyPerMonth: 32.99,
    priceYearlyTotal: 395.88,
    envMonthly: "STRIPE_PRICE_PLATIN_MONTHLY",
    envYearly: "STRIPE_PRICE_PLATIN_YEARLY",
  },
};

/** Tarife aufsteigend nach Einheiten-Limit. */
export const PLAN_ORDER: PlanKey[] = ["bronze", "silber", "gold", "platin"];

/** Ab dieser Einheitenzahl greift der Enterprise-Tarif (individuell). */
export const ENTERPRISE_MIN_UNITS = 21;

export function isPlanKey(value: string): value is PlanKey {
  return value === "bronze" || value === "silber" || value === "gold" || value === "platin";
}

/** Name der Env-Var mit der passenden Stripe-Price-ID. */
export function stripePriceEnvVar(
  plan: PlanKey,
  interval: BillingInterval,
): string {
  return interval === "yearly" ? PLANS[plan].envYearly : PLANS[plan].envMonthly;
}

// ----------------------------------------------------------------------------
// Zugriffs-Status (Gating)
// ----------------------------------------------------------------------------

export interface AccessInput {
  /** subscription_status aus der DB (trialing | active | past_due | canceled | …). */
  subscription_status: string;
  /** Ende des Testzeitraums (ISO) oder null. */
  trial_ends_at: string | null;
  /** Ende der bezahlten Periode (ISO) oder null. */
  current_period_end: string | null;
  /** Stripe-Abo-ID (gesetzt = es gab/gibt ein Abo). Optional. */
  subscription_id?: string | null;
  /** Zum Periodenende gekündigt? Optional. */
  cancel_at_period_end?: boolean | null;
  /** Ende des Lesezugriffs nach Abo-Ende/Trial-Ablauf (ISO) oder null. */
  access_until?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Kulanzfrist nach Periodenende, bevor bei past_due gesperrt wird. */
const PAST_DUE_GRACE_DAYS = 7;
/** Dauer des Lesezugriffs nach Abo-Ende bzw. Trial-Ablauf. */
export const READONLY_MONTHS = 6;
/** Karenz nach Ablauf des Lesezugriffs, bevor gelöscht wird. */
export const DELETION_GRACE_DAYS = 7;

/**
 * Ermittelt den Zugriffsstatus. Voller Schreibzugriff ('active'/'trial') gilt:
 *  - aktives Abo (subscription_status 'active'),
 *  - Stripe-Trial mit hinterlegtem Abo (Status 'trialing' + subscription_id),
 *  - gekündigtes Abo, das bis Periodenende bezahlt ist
 *    (cancel_at_period_end && current_period_end > now),
 *  - Zahlung überfällig innerhalb der 7-Tage-Kulanz,
 *  - laufender App-Testzeitraum (trial_ends_at > now, kein beendetes Abo).
 * 'readonly': kein Schreibzugriff, aber access_until > now.
 * 'locked': alles andere.
 */
export function getAccessStatus(user: AccessInput, now: Date = new Date()): AccessStatus {
  const nowMs = now.getTime();
  const status = user.subscription_status;
  const periodActive =
    !!user.current_period_end &&
    new Date(user.current_period_end).getTime() > nowMs;

  // 1) Aktives, bezahltes Abo (inkl. Stripe-Trial mit hinterlegtem Abo).
  if (status === "active") return "active";
  if (status === "trialing" && user.subscription_id) return "active";

  // 2) Gekündigt, aber bis Periodenende bezahlt → voller Zugriff bis dahin.
  if (user.cancel_at_period_end && periodActive) return "active";

  // 3) Zahlung überfällig, aber innerhalb der Kulanzfrist.
  if (status === "past_due" && user.current_period_end) {
    const graceEnd =
      new Date(user.current_period_end).getTime() + PAST_DUE_GRACE_DAYS * DAY_MS;
    if (nowMs < graceEnd) return "active";
  }

  // 4) Laufender App-Testzeitraum (kein beendetes Abo) → voller Schreibzugriff.
  if (
    status !== "canceled" &&
    user.trial_ends_at &&
    new Date(user.trial_ends_at).getTime() > nowMs
  ) {
    return "trial";
  }

  // 5) Kein aktiver Zugriff mehr → Lesemodus, solange die Lesefrist läuft.
  if (user.access_until && new Date(user.access_until).getTime() > nowMs) {
    return "readonly";
  }

  // 6) sonst gesperrt.
  return "locked";
}

/** Darf der Nutzer schreibende Aktionen ausführen? Nur mit aktivem Abo/Trial. */
export function canWrite(status: AccessStatus): boolean {
  return status === "active" || status === "trial";
}

/** Aufgerundete Tage bis zu einem Zeitpunkt (ISO) – nie negativ. */
export function daysUntil(dateIso: string | null, now: Date = new Date()): number {
  if (!dateIso) return 0;
  const diff = new Date(dateIso).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / DAY_MS));
}

/** Verbleibende (aufgerundete) Tage im Testzeitraum – nie negativ. */
export function trialDaysRemaining(
  trialEndsAt: string | null,
  now: Date = new Date(),
): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / DAY_MS));
}

// ----------------------------------------------------------------------------
// Einheiten-Limit
// ----------------------------------------------------------------------------

/**
 * Maximale Einheitenzahl für einen Nutzer. `null` = unbegrenzt (Enterprise).
 * Im Trial gilt das Platin-Limit (20).
 */
export function unitLimitFor(plan: string, accessStatus: AccessStatus): number | null {
  if (plan === "enterprise") return null;
  if (accessStatus === "trial") return PLANS.platin.unitLimit;
  if (isPlanKey(plan)) return PLANS[plan].unitLimit;
  // Fallback (z. B. plan='trial' ohne aktiven Trial): Platin-Limit.
  return PLANS.platin.unitLimit;
}

/**
 * Name des nächstgrößeren Tarifs, gemessen am aktuellen Einheiten-Limit.
 * Ist bereits das höchste Limit erreicht (oder unbegrenzt), wird "Enterprise"
 * zurückgegeben.
 */
export function nextPlanName(currentLimit: number | null): string {
  if (currentLimit !== null) {
    for (const key of PLAN_ORDER) {
      if (PLANS[key].unitLimit > currentLimit) return PLANS[key].name;
    }
  }
  return "Enterprise";
}
