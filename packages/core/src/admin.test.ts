import { describe, it, expect } from "vitest";
import {
  normalizeCity,
  avgRentPerSqm,
  parseAdminStats,
  parseCityStats,
} from "./admin";

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
