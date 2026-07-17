// ============================================================================
// Nutzer-Dashboard „Deine Zahlen" – reine Aggregationslogik (framework-frei,
// testbar). Wird serverseitig über RLS-gescopte Rohdaten aufgerufen; die
// Gruppierung passiert hier, damit die Server-Komponente schlank bleibt.
// ============================================================================

const MONTHS_DE = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

/** YYYY-MM aus einem ISO-Datum/Zeitstempel. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export interface ChargeInput {
  /** period (1. des Monats) bzw. beliebiges ISO-Datum. */
  period: string;
  amount: number;
}

export interface PaymentInput {
  paidAt: string;
  amount: number;
}

export interface MonthPoint {
  ym: string;
  label: string;
  year: number;
  soll: number;
  ist: number;
  /** Ist < Soll (und Soll > 0) → roter Marker. */
  shortfall: boolean;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/**
 * Baut die 12-Monats-Reihe (Soll vs. Ist) endend im Monat von `now`.
 * Soll = Summe der Charges je Monat (nach period), Ist = Summe der Zahlungen
 * je Monat (nach paidAt).
 */
export function buildMonthlySeries(
  charges: ChargeInput[],
  payments: PaymentInput[],
  now: Date = new Date(),
): MonthPoint[] {
  const sollByYm = new Map<string, number>();
  for (const c of charges) {
    const k = monthKey(c.period);
    sollByYm.set(k, (sollByYm.get(k) ?? 0) + c.amount);
  }
  const istByYm = new Map<string, number>();
  for (const p of payments) {
    const k = monthKey(p.paidAt);
    istByYm.set(k, (istByYm.get(k) ?? 0) + p.amount);
  }

  const out: MonthPoint[] = [];
  let y = now.getFullYear();
  let m = now.getMonth(); // 0-basiert
  for (let i = 0; i < 12; i++) {
    const ym = `${y}-${String(m + 1).padStart(2, "0")}`;
    const soll = round2(sollByYm.get(ym) ?? 0);
    const ist = round2(istByYm.get(ym) ?? 0);
    out.unshift({
      ym,
      label: MONTHS_DE[m]!,
      year: y,
      soll,
      ist,
      shortfall: soll > 0 && ist < soll,
    });
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
  }
  return out;
}

/** Anzahl Monate mit erfassten Daten (Soll oder Ist > 0). */
export function monthsWithData(series: MonthPoint[]): number {
  return series.filter((p) => p.soll > 0 || p.ist > 0).length;
}

/** Ist-Einnahmen des laufenden Monats (letzter Punkt der Reihe). */
export function currentMonthIst(series: MonthPoint[]): number {
  return series.length > 0 ? series[series.length - 1]!.ist : 0;
}

// ---- Offene Posten --------------------------------------------------------

export interface BalanceInput {
  tenantId: string;
  firstName: string | null;
  lastName: string | null;
  unitId: string | null;
  balance: number;
}

/** Summe aller positiven Salden (offene Forderungen). */
export function openPositionsTotal(balances: BalanceInput[]): number {
  return round2(
    balances.reduce((s, b) => (b.balance > 0 ? s + b.balance : s), 0),
  );
}

/** Top-N Mieter mit Saldo > 0, absteigend. */
export function topOpenPositions(
  balances: BalanceInput[],
  n = 5,
): BalanceInput[] {
  return balances
    .filter((b) => b.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, n);
}

// ---- Kostenstruktur -------------------------------------------------------

export interface DashboardCostInput {
  costType: string;
  amount: number;
  apportionable: boolean;
}

export interface CostGroup {
  costType: string;
  sum: number;
  /** Überwiegend umlagefähig? (für die Grün-/Grau-Färbung) */
  apportionable: boolean;
}

/**
 * Gruppiert Betriebskosten je Kostenart. `apportionable` je Gruppe = die
 * umlagefähige Teilsumme überwiegt (≥ Hälfte). Sortiert nach Summe absteigend.
 */
export function groupCostsByType(records: DashboardCostInput[]): {
  groups: CostGroup[];
  total: number;
} {
  const sumByType = new Map<string, number>();
  const apportByType = new Map<string, number>();
  let total = 0;
  for (const r of records) {
    total += r.amount;
    sumByType.set(r.costType, (sumByType.get(r.costType) ?? 0) + r.amount);
    if (r.apportionable) {
      apportByType.set(
        r.costType,
        (apportByType.get(r.costType) ?? 0) + r.amount,
      );
    }
  }
  const groups: CostGroup[] = [...sumByType.entries()]
    .map(([costType, sum]) => ({
      costType,
      sum: round2(sum),
      apportionable: (apportByType.get(costType) ?? 0) * 2 >= sum,
    }))
    .sort((a, b) => b.sum - a.sum);
  return { groups, total: round2(total) };
}
