import { describe, it, expect } from "vitest";
import { commercialLeaseEndDate } from "./lease";

describe("commercialLeaseEndDate", () => {
  it("berechnet den Tag vor dem Jahrestag", () => {
    expect(commercialLeaseEndDate("2024-01-01", 5)).toBe("2028-12-31");
    expect(commercialLeaseEndDate("2024-07-01", 1)).toBe("2025-06-30");
  });

  it("behandelt den 29. Februar korrekt", () => {
    expect(commercialLeaseEndDate("2024-02-29", 1)).toBe("2025-02-28");
  });

  it("liefert '' bei fehlendem Datum oder ungültiger Laufzeit", () => {
    expect(commercialLeaseEndDate("", 5)).toBe("");
    expect(commercialLeaseEndDate("2024-01-01", 0)).toBe("");
    expect(commercialLeaseEndDate("2024-01-01", -1)).toBe("");
    expect(commercialLeaseEndDate("kein-datum", 5)).toBe("");
  });
});
