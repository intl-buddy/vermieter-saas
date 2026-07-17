import { describe, it, expect } from "vitest";
import {
  normalizeCity,
  avgRentPerSqm,
  parseAdminStats,
  parseCityStats,
  computeRevenue,
  parseRevenueRows,
  type PriceMap,
} from "./admin";

const PRICE_MAP: PriceMap = {
  price_bronze_m: {
    planKey: "bronze",
    planName: "Bronze",
    interval: "monthly",
    grossPrice: 9.99,
  },
  price_bronze_y: {
    planKey: "bronze",
    planName: "Bronze",
    interval: "yearly",
    grossPrice: 95.88, // /12 = 7.99
  },
  price_gold_m: {
    planKey: "gold",
    planName: "Gold",
    interval: "monthly",
    grossPrice: 24.99,
  },
};

describe("normalizeCity", () => {
  it("vereinheitlicht Groß-/Kleinschreibung und trimmt", () => {
    expect(normalizeCity("  BERLIN ")).toBe("Berlin");
    expect(normalizeCity("berlin")).toBe("Berlin");
    expect(normalizeCity("bErLiN")).toBe("Berlin");
  });

  it("fasst so verschiedene Schreibweisen zusammen", () => {
    expect(normalizeCity("Berlin ")).toBe(normalizeCity("berlin"));
    expect(normalizeCity("BAD HOMBURG")).toBe("Bad Homburg");
  });

  it("kollabiert Mehrfach-Leerzeichen", () => {
    expect(normalizeCity("Frankfurt   am   Main")).toBe("Frankfurt Am Main");
  });

  it("liefert für leere Angaben einen Platzhalter", () => {
    expect(normalizeCity("")).toBe("Ohne Angabe");
    expect(normalizeCity("   ")).toBe("Ohne Angabe");
    expect(normalizeCity(null)).toBe("Ohne Angabe");
    expect(normalizeCity(undefined)).toBe("Ohne Angabe");
  });
});

describe("avgRentPerSqm", () => {
  it("berechnet Kaltmiete pro m² auf 2 Stellen gerundet", () => {
    expect(avgRentPerSqm(1000, 80)).toBe(12.5);
    expect(avgRentPerSqm(1234.56, 100)).toBe(12.35);
  });

  it("gibt bei fehlender Fläche null zurück (keine Division durch 0)", () => {
    expect(avgRentPerSqm(1000, 0)).toBeNull();
    expect(avgRentPerSqm(0, 0)).toBeNull();
    expect(avgRentPerSqm(500, -10)).toBeNull();
  });
});

describe("parseAdminStats", () => {
  it("liest die Kennzahlen defensiv (auch String-Zahlen aus JSONB)", () => {
    const stats = parseAdminStats({
      users_total: 42,
      users_trial: "10",
      users_active: 25,
      users_readonly: 7,
      users_last_7: 3,
      users_last_30: "11",
      properties_total: 18,
      units_total: 96,
      active_tenancies: 80,
      sum_cold_rent: "64000.50",
      sum_prepayments: 12800,
    });
    expect(stats.usersTotal).toBe(42);
    expect(stats.usersTrial).toBe(10);
    expect(stats.usersLast30).toBe(11);
    expect(stats.sumColdRent).toBe(64000.5);
    expect(stats.activeTenancies).toBe(80);
  });

  it("füllt fehlende Felder mit 0", () => {
    const stats = parseAdminStats({});
    expect(stats.usersTotal).toBe(0);
    expect(stats.sumPrepayments).toBe(0);
  });
});

describe("parseCityStats", () => {
  it("normalisiert die Stadt und übernimmt die Kennzahlen", () => {
    const rows = parseCityStats([
      {
        city: "berlin",
        properties: 3,
        units: 12,
        active_tenancies: 10,
        avg_rent_per_sqm: "12.50",
      },
      {
        city: "Hamburg",
        properties: 1,
        units: 4,
        active_tenancies: 0,
        avg_rent_per_sqm: null,
      },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.city).toBe("Berlin");
    expect(rows[0]!.avgRentPerSqm).toBe(12.5);
    expect(rows[1]!.avgRentPerSqm).toBeNull();
  });

  it("liefert für Nicht-Arrays eine leere Liste", () => {
    expect(parseCityStats(null)).toEqual([]);
    expect(parseCityStats({})).toEqual([]);
  });
});

describe("computeRevenue", () => {
  it("teilt Jahresabos für den MRR durch 12", () => {
    const r = computeRevenue(
      [{ priceId: "price_bronze_y", subs: 1, canceling: 0 }],
      PRICE_MAP,
    );
    // 95,88 / 12 = 7,99
    expect(r.mrrGross).toBe(7.99);
    expect(r.byPlan[0]!.yearly).toBe(1);
    expect(r.byPlan[0]!.monthly).toBe(0);
  });

  it("zählt gekündigte-aber-laufende Abos voll zum MRR und als churn", () => {
    const r = computeRevenue(
      [{ priceId: "price_gold_m", subs: 3, canceling: 2 }],
      PRICE_MAP,
    );
    expect(r.mrrGross).toBe(round(24.99 * 3));
    expect(r.churn).toBe(2);
    expect(r.byPlan[0]!.monthly).toBe(3);
  });

  it("summiert über Pläne und rechnet Netto (÷1,19) und ARR (×12)", () => {
    const r = computeRevenue(
      [
        { priceId: "price_bronze_m", subs: 2, canceling: 0 }, // 19,98
        { priceId: "price_bronze_y", subs: 1, canceling: 1 }, // 7,99
        { priceId: "price_gold_m", subs: 1, canceling: 0 }, // 24,99
      ],
      PRICE_MAP,
    );
    const gross = round(9.99 * 2 + 95.88 / 12 + 24.99);
    expect(r.mrrGross).toBe(gross);
    expect(r.mrrNet).toBe(round(gross / 1.19));
    expect(r.arrGross).toBe(round(gross * 12));
    expect(r.churn).toBe(1);
    // Bronze fasst monatlich + jährlich zusammen
    const bronze = r.byPlan.find((p) => p.planKey === "bronze")!;
    expect(bronze.monthly).toBe(2);
    expect(bronze.yearly).toBe(1);
  });

  it("zählt nicht zuordenbare price_ids als unmapped, nicht zum MRR", () => {
    const r = computeRevenue(
      [
        { priceId: "price_unknown", subs: 5, canceling: 0 },
        { priceId: null, subs: 1, canceling: 0 },
      ],
      PRICE_MAP,
    );
    expect(r.mrrGross).toBe(0);
    expect(r.unmapped).toBe(6);
    expect(r.byPlan).toEqual([]);
  });
});

describe("parseRevenueRows", () => {
  it("liest price_id/subs/canceling defensiv", () => {
    const rows = parseRevenueRows([
      { price_id: "price_x", subs: "4", canceling: 1 },
      { price_id: null, subs: 2 },
    ]);
    expect(rows[0]).toEqual({ priceId: "price_x", subs: 4, canceling: 1 });
    expect(rows[1]).toEqual({ priceId: null, subs: 2, canceling: 0 });
  });
});

function round(x: number): number {
  return Math.round(x * 100) / 100;
}
