import { describe, it, expect } from "vitest";
import {
  daysInclusive,
  overlapDays,
  toEpochDay,
  computeOccupancy,
  calculateBilling,
  roundCent,
  type BillingInput,
  type CostRecordInput,
  type TenancyInput,
} from "./billing";

const P_START = "2025-01-01";
const P_END = "2025-01-10"; // 10 Tage

function baseInput(over: Partial<BillingInput> = {}): BillingInput {
  return {
    period_start: P_START,
    period_end: P_END,
    units: [{ id: "U1", living_area: 100, ownership_share: null }],
    tenancies: [],
    records: [],
    heating: {},
    prepaymentsOperating: {},
    prepaymentsHeating: {},
    ...over,
  };
}

function record(over: Partial<CostRecordInput> = {}): CostRecordInput {
  return {
    id: "R1",
    cost_type: "misc",
    allocation_key: "living_area",
    amount: 100,
    is_apportionable: true,
    unit_id: null,
    labor_cost_35a: 0,
    type_35a: "none",
    ...over,
  };
}

function tenancy(over: Partial<TenancyInput> = {}): TenancyInput {
  return {
    tenant_id: "T1",
    unit_id: "U1",
    move_in: "2024-01-01",
    move_out: null,
    persons_count: 2,
    ...over,
  };
}

describe("Datums-Helfer", () => {
  it("zählt Tage inklusive", () => {
    expect(daysInclusive("2025-01-01", "2025-01-10")).toBe(10);
    expect(daysInclusive("2025-01-01", "2025-01-01")).toBe(1);
    expect(daysInclusive("2025-01-10", "2025-01-01")).toBe(0);
  });

  it("berechnet Überschneidungstage", () => {
    expect(overlapDays("2025-01-01", "2025-01-10", "2025-01-06", "2025-01-31")).toBe(5);
    expect(overlapDays("2025-01-01", "2025-01-05", "2025-01-06", "2025-01-10")).toBe(0);
  });

  it("rundet kaufmännisch auf Cent", () => {
    expect(roundCent(33.333)).toBe(33.33);
    expect(roundCent(66.666)).toBe(66.67);
    expect(roundCent(2.005)).toBe(2.01);
    expect(roundCent(-10)).toBe(-10);
  });
});

describe("computeOccupancy", () => {
  it("volle Belegung", () => {
    const o = computeOccupancy(tenancy(), P_START, P_END);
    expect(o.occDays).toBe(10);
    expect(o.personDays).toBe(20);
  });

  it("unterjähriger Einzug", () => {
    const o = computeOccupancy(tenancy({ move_in: "2025-01-06" }), P_START, P_END);
    expect(o.occDays).toBe(5);
    expect(o.personDays).toBe(10);
  });

  it("Auszug im Zeitraum", () => {
    const o = computeOccupancy(
      tenancy({ move_in: "2025-01-01", move_out: "2025-01-04" }),
      P_START,
      P_END,
    );
    expect(o.occDays).toBe(4);
  });

  it("Personentage aus Personenperioden (tagesgenau)", () => {
    const o = computeOccupancy(
      tenancy({
        person_periods: [
          { from: "2025-01-01", to: "2025-01-05", persons: 2 },
          { from: "2025-01-06", to: "2025-01-10", persons: 3 },
        ],
      }),
      P_START,
      P_END,
    );
    // 2×5 + 3×5 = 25
    expect(o.personDays).toBe(25);
  });
});

describe("calculateBilling – Verteilung", () => {
  it("Wohnfläche, eine voll belegte Einheit → 100 % Mieter, kein Eigentümeranteil", () => {
    const res = calculateBilling(
      baseInput({ tenancies: [tenancy()], records: [record({ amount: 100 })] }),
    );
    expect(res.statements).toHaveLength(1);
    expect(res.statements[0].total_share).toBe(100);
    expect(res.owner.total_share).toBe(0);
    expect(res.statements[0].balance).toBe(100);
  });

  it("Leerstand → hälftiger Eigentümeranteil", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [tenancy({ move_in: "2025-01-06" })], // 5 von 10 Tagen
        records: [record({ amount: 100 })],
      }),
    );
    expect(res.statements[0].total_share).toBe(50);
    expect(res.owner.total_share).toBe(50);
    expect(res.owner.positions[0].reason).toBe("vacancy");
  });

  it("Schlüssel units: leere Einheit erzeugt Eigentümeranteil", () => {
    const res = calculateBilling(
      baseInput({
        units: [
          { id: "U1", living_area: 100, ownership_share: null },
          { id: "U2", living_area: 50, ownership_share: null },
        ],
        tenancies: [tenancy()], // nur U1 belegt
        records: [record({ allocation_key: "units", amount: 100 })],
      }),
    );
    expect(res.statements[0].total_share).toBe(50);
    expect(res.owner.total_share).toBe(50);
  });

  it("Direktzuordnung mit Mieterwechsel in einer Einheit", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [
          tenancy({ tenant_id: "T1", move_in: "2025-01-01", move_out: "2025-01-05" }),
          tenancy({ tenant_id: "T2", move_in: "2025-01-06", move_out: null }),
        ],
        records: [record({ allocation_key: "direct", unit_id: "U1", amount: 100 })],
      }),
    );
    const t1 = res.statements.find((s) => s.tenant_id === "T1")!;
    const t2 = res.statements.find((s) => s.tenant_id === "T2")!;
    expect(t1.total_share).toBe(50);
    expect(t2.total_share).toBe(50);
    expect(res.owner.total_share).toBe(0);
  });

  it("Direktzuordnung an ein Mietverhältnis: 100 %, unabhängig von Miettagen", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [
          tenancy({ tenant_id: "T1", move_in: "2025-01-01", move_out: "2025-01-05" }),
          tenancy({ tenant_id: "T2", move_in: "2025-01-06", move_out: null }),
        ],
        // Direktzuordnung an T2 – obwohl T2 nur die Hälfte des Zeitraums bewohnt.
        records: [
          record({ allocation_key: "direct", tenant_id: "T2", amount: 100 }),
        ],
      }),
    );
    const t1 = res.statements.find((s) => s.tenant_id === "T1")!;
    const t2 = res.statements.find((s) => s.tenant_id === "T2")!;
    expect(t2.total_share).toBe(100);
    expect(t1.total_share).toBe(0);
    expect(res.owner.total_share).toBe(0);
  });

  it("Direktzuordnung an ein Mietverhältnis außerhalb des Zeitraums → Eigentümer", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [tenancy({ tenant_id: "T1" })],
        records: [
          record({ allocation_key: "direct", tenant_id: "TX", amount: 100 }),
        ],
      }),
    );
    expect(res.owner.total_share).toBe(100);
    expect(res.statements.find((s) => s.tenant_id === "T1")!.total_share).toBe(0);
  });

  it("Schlüssel persons ohne Perioden", () => {
    const res = calculateBilling(
      baseInput({
        units: [
          { id: "U1", living_area: 100, ownership_share: null },
          { id: "U2", living_area: 100, ownership_share: null },
        ],
        tenancies: [
          tenancy({ tenant_id: "T1", unit_id: "U1", persons_count: 2 }),
          tenancy({ tenant_id: "T2", unit_id: "U2", persons_count: 3 }),
        ],
        records: [record({ allocation_key: "persons", amount: 100 })],
      }),
    );
    const t1 = res.statements.find((s) => s.tenant_id === "T1")!;
    const t2 = res.statements.find((s) => s.tenant_id === "T2")!;
    // 20 vs 30 Personentage → 40 / 60
    expect(t1.total_share).toBe(40);
    expect(t2.total_share).toBe(60);
  });

  it("nicht umlagefähige Belege gehen vollständig an den Eigentümer", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [tenancy()],
        records: [record({ amount: 100, is_apportionable: false })],
      }),
    );
    expect(res.statements[0].total_share).toBe(0);
    expect(res.owner.total_share).toBe(100);
    expect(res.owner.positions[0].reason).toBe("non_apportionable");
  });

  it("§35a-Lohnanteile werden nach Kategorie getrennt summiert", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [tenancy()],
        records: [
          record({
            id: "R1",
            amount: 100,
            labor_cost_35a: 40,
            type_35a: "craftsman_service",
          }),
          record({
            id: "R2",
            amount: 60,
            labor_cost_35a: 30,
            type_35a: "household_service",
          }),
        ],
      }),
    );
    const t1 = res.statements[0];
    expect(t1.labor_35a_craftsman).toBe(40);
    expect(t1.labor_35a_household).toBe(30);
  });

  it("Rundungsdifferenz landet im Eigentümeranteil (Summenausgleich)", () => {
    const res = calculateBilling(
      baseInput({
        units: [
          { id: "U1", living_area: 1, ownership_share: null },
          { id: "U2", living_area: 1, ownership_share: null },
          { id: "U3", living_area: 1, ownership_share: null },
        ],
        tenancies: [
          tenancy({ tenant_id: "T1", unit_id: "U1" }),
          tenancy({ tenant_id: "T2", unit_id: "U2" }),
          tenancy({ tenant_id: "T3", unit_id: "U3" }),
        ],
        records: [record({ amount: 100 })],
      }),
    );
    const sumTenants = res.statements.reduce((s, t) => s + t.total_share, 0);
    // 33.33 × 3 = 99.99, Rest 0.01 beim Eigentümer
    expect(roundCent(sumTenants)).toBe(99.99);
    expect(res.owner.total_share).toBe(0.01);
    expect(roundCent(sumTenants + res.owner.total_share)).toBe(100);
  });

  it("Saldo aus Anteil + Heizkosten − Vorauszahlungen (Guthaben)", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [tenancy()],
        records: [record({ amount: 100 })],
        heating: { T1: 50 },
        prepaymentsOperating: { T1: 120 },
        prepaymentsHeating: { T1: 40 },
      }),
    );
    const t1 = res.statements[0];
    expect(t1.heating_costs).toBe(50);
    // (100 + 50) − (120 + 40) = −10
    expect(t1.balance).toBe(-10);
  });
});

describe("Null-Sicherheit (nullable Schema-Felder)", () => {
  it("Datums-Helfer werfen bei null nicht, sondern liefern 0/NaN", () => {
    expect(daysInclusive(null, "2025-01-10")).toBe(0);
    expect(daysInclusive("2025-01-01", null)).toBe(0);
    expect(daysInclusive(undefined, undefined)).toBe(0);
    expect(overlapDays(null, "2025-01-10", "2025-01-06", "2025-01-31")).toBe(0);
    expect(Number.isNaN(toEpochDay(null))).toBe(true);
    expect(Number.isNaN(toEpochDay("kein-datum"))).toBe(true);
  });

  it("Mieter ohne move_out_date (laufend) → Belegung bis Periodenende", () => {
    const o = computeOccupancy(
      tenancy({ move_in: "2025-01-01", move_out: null }),
      P_START,
      P_END,
    );
    expect(o.occDays).toBe(10);
    expect(o.occTo).toBe(P_END);
  });

  it("ungültiges move_in bringt die Belegung nicht zum Absturz", () => {
    const o = computeOccupancy(
      tenancy({ move_in: null as unknown as string, move_out: null }),
      P_START,
      P_END,
    );
    // Fallback: Belegung ab Periodenbeginn, kein Fehler
    expect(o.occDays).toBe(10);
    expect(o.occFrom).toBe(P_START);
  });

  it("Position enthält basis_total, basis_tenant und ungerundeten unit_price", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [tenancy({ move_in: "2025-01-06" })], // 5 von 10 Tagen
        records: [record({ amount: 100 })],
      }),
    );
    const pos = res.statements[0].positions[0];
    expect(pos.basis_total).toBe(1000); // 100 m² × 10 Tage
    expect(pos.basis_tenant).toBe(500); // 100 m² × 5 Tage
    expect(pos.unit_price).toBeCloseTo(0.1, 10); // 100 € / 1000, ungerundet
    // Ihr Anteil = unit_price × Ihre Einheiten, kaufmännisch gerundet
    expect(roundCent(pos.unit_price * pos.basis_tenant)).toBe(pos.share);
    expect(pos.share).toBe(50);
  });

  it("laufender Mieter + Beleg (ohne Zahlungsdatum) wird korrekt verteilt", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [tenancy({ move_out: null })],
        records: [record({ amount: 100 })],
      }),
    );
    expect(res.statements[0].total_share).toBe(100);
    expect(res.owner.total_share).toBe(0);
  });
});

describe("Vorauszahlungs-Modus & manuelle Werte", () => {
  it("combined-Modus: Gesamt-BK-Vorauszahlung, Heizkosten-VZ = 0", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [tenancy()],
        records: [record({ amount: 100 })],
        heating: { T1: 40 },
        prepaymentsOperating: { T1: 130 }, // Gesamt-Betriebskostenvorauszahlung
        prepaymentsHeating: { T1: 0 },
      }),
    );
    const t1 = res.statements[0];
    expect(t1.prepayments_operating).toBe(130);
    expect(t1.prepayments_heating).toBe(0);
    // (100 + 40) − 130 = 10 Nachzahlung
    expect(t1.balance).toBe(10);
  });

  it("manuell überschriebene Vorauszahlung fließt in den Saldo (Alt-Jahr)", () => {
    const res = calculateBilling(
      baseInput({
        tenancies: [tenancy()],
        records: [record({ amount: 200 })],
        heating: { T1: 0 },
        // Für ein Jahr vor tefter-Nutzung manuell eingetragen:
        prepaymentsOperating: { T1: 250 },
        prepaymentsHeating: { T1: 0 },
      }),
    );
    const t1 = res.statements[0];
    expect(t1.prepayments_operating).toBe(250);
    expect(t1.balance).toBe(-50); // 200 − 250 = −50 Guthaben
  });
});
