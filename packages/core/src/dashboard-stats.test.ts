import { describe, it, expect } from "vitest";
import {
  buildMonthlySeries,
  monthsWithData,
  currentMonthIst,
  openPositionsTotal,
  topOpenPositions,
  groupCostsByType,
  monthKey,
  type BalanceInput,
} from "./dashboard-stats";

describe("buildMonthlySeries", () => {
  const now = new Date("2026-07-15T12:00:00Z");

  it("liefert 12 Monate endend im aktuellen Monat", () => {
    const s = buildMonthlySeries([], [], now);
    expect(s).toHaveLength(12);
    expect(s[11]!.ym).toBe("2026-07");
    expect(s[0]!.ym).toBe("2025-08");
    expect(s[11]!.label).toBe("Jul");
  });

  it("summiert Soll je period-Monat und Ist je paidAt-Monat", () => {
    const s = buildMonthlySeries(
      [
        { period: "2026-07-01", amount: 800 },
        { period: "2026-07-01", amount: 200 },
        { period: "2026-06-01", amount: 500 },
      ],
      [
        { paidAt: "2026-07-05", amount: 800 },
        { paidAt: "2026-07-20T09:00:00Z", amount: 100 },
      ],
      now,
    );
    const jul = s[11]!;
    expect(jul.soll).toBe(1000);
    expect(jul.ist).toBe(900);
    expect(jul.shortfall).toBe(true); // 900 < 1000
    const jun = s[10]!;
    expect(jun.soll).toBe(500);
    expect(jun.ist).toBe(0);
    expect(jun.shortfall).toBe(true);
  });

  it("markiert keinen shortfall, wenn Soll = 0", () => {
    const s = buildMonthlySeries([], [{ paidAt: "2026-07-01", amount: 50 }], now);
    expect(s[11]!.shortfall).toBe(false);
  });

  it("kein shortfall, wenn Ist ≥ Soll", () => {
    const s = buildMonthlySeries(
      [{ period: "2026-07-01", amount: 500 }],
      [{ paidAt: "2026-07-01", amount: 500 }],
      now,
    );
    expect(s[11]!.shortfall).toBe(false);
  });

  it("ignoriert Monate außerhalb des 12-Monats-Fensters nicht fälschlich", () => {
    // Zahlung vor 13 Monaten taucht nicht auf
    const s = buildMonthlySeries([], [{ paidAt: "2025-06-01", amount: 999 }], now);
    expect(s.some((p) => p.ist === 999)).toBe(false);
  });
});

describe("monthsWithData / currentMonthIst", () => {
  const now = new Date("2026-07-15T12:00:00Z");
  it("zählt Monate mit Soll oder Ist", () => {
    const s = buildMonthlySeries(
      [{ period: "2026-05-01", amount: 100 }],
      [{ paidAt: "2026-07-01", amount: 100 }],
      now,
    );
    expect(monthsWithData(s)).toBe(2);
  });
  it("gibt den Ist des laufenden Monats", () => {
    const s = buildMonthlySeries([], [{ paidAt: "2026-07-09", amount: 321 }], now);
    expect(currentMonthIst(s)).toBe(321);
  });
});

describe("monthKey", () => {
  it("schneidet YYYY-MM ab", () => {
    expect(monthKey("2026-07-01")).toBe("2026-07");
    expect(monthKey("2026-07-20T09:00:00Z")).toBe("2026-07");
  });
});

describe("openPositionsTotal / topOpenPositions", () => {
  const balances: BalanceInput[] = [
    { tenantId: "a", firstName: "A", lastName: "1", unitId: "u1", balance: 300 },
    { tenantId: "b", firstName: "B", lastName: "2", unitId: "u2", balance: -50 },
    { tenantId: "c", firstName: "C", lastName: "3", unitId: "u3", balance: 120 },
    { tenantId: "d", firstName: "D", lastName: "4", unitId: "u4", balance: 0 },
  ];

  it("summiert nur positive Salden", () => {
    expect(openPositionsTotal(balances)).toBe(420);
  });

  it("liefert nur Salden > 0, absteigend, begrenzt", () => {
    const top = topOpenPositions(balances, 5);
    expect(top.map((b) => b.tenantId)).toEqual(["a", "c"]);
    expect(topOpenPositions(balances, 1)).toHaveLength(1);
  });
});

describe("groupCostsByType", () => {
  it("gruppiert, summiert und sortiert absteigend", () => {
    const { groups, total } = groupCostsByType([
      { costType: "heating", amount: 500, apportionable: true },
      { costType: "heating", amount: 100, apportionable: true },
      { costType: "insurance", amount: 300, apportionable: true },
      { costType: "non_apportionable", amount: 200, apportionable: false },
    ]);
    expect(total).toBe(1100);
    expect(groups[0]).toEqual({ costType: "heating", sum: 600, apportionable: true });
    expect(groups.map((g) => g.costType)).toEqual([
      "heating",
      "insurance",
      "non_apportionable",
    ]);
    expect(groups.find((g) => g.costType === "non_apportionable")!.apportionable).toBe(
      false,
    );
  });

  it("markiert eine Gruppe als nicht umlagefähig, wenn die Teilsumme überwiegt", () => {
    const { groups } = groupCostsByType([
      { costType: "other_operating_costs", amount: 100, apportionable: true },
      { costType: "other_operating_costs", amount: 300, apportionable: false },
    ]);
    expect(groups[0]!.apportionable).toBe(false); // 100 < 200 (Hälfte von 400)
  });
});
