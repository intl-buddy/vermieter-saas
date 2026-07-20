// ============================================================================
// Nebenkosten-Berechnung – reine, testbare Funktionen.
// Tagesgenaue Verteilung nach Umlageschlüssel; Leerstands-/Eigentümeranteil
// entsteht aus der Differenz zwischen theoretischem Maximum (alle Einheiten ×
// volle Tage) und der Summe der Mieteranteile. §35a-Lohnanteile werden mit
// demselben Schlüssel verteilt und nach Kategorie getrennt summiert.
// ============================================================================

export type AllocationKey =
  | "living_area"
  | "persons"
  | "units"
  | "consumption"
  | "ownership_share"
  | "direct";

export type Type35a = "none" | "household_service" | "craftsman_service";

export interface UnitInput {
  id: string;
  living_area: number | null;
  ownership_share: number | null;
}

export interface PersonPeriodInput {
  from: string; // YYYY-MM-DD inklusiv
  to: string | null; // YYYY-MM-DD inklusiv, null = laufend (offenes Ende)
  persons: number;
}

export interface TenancyInput {
  tenant_id: string;
  unit_id: string;
  move_in: string; // YYYY-MM-DD inklusiv
  move_out: string | null; // YYYY-MM-DD inklusiv, null = laufend
  persons_count: number;
  person_periods?: PersonPeriodInput[];
}

export interface CostRecordInput {
  id: string;
  cost_type: string;
  allocation_key: AllocationKey;
  amount: number;
  is_apportionable: boolean;
  unit_id: string | null;
  /**
   * Bei `allocation_key === "direct"` und gesetztem `tenant_id`: der Beleg wird
   * zu 100 % diesem Mietverhältnis zugeordnet – unabhängig von den Miettagen.
   * Ist `tenant_id` null, greift die Direktzuordnung auf `unit_id` (anteilig
   * nach Miettagen, falls die Einheit im Zeitraum den Mieter wechselte).
   */
  tenant_id?: string | null;
  labor_cost_35a: number;
  type_35a: Type35a;
}

export interface BillingInput {
  period_start: string;
  period_end: string;
  units: UnitInput[];
  tenancies: TenancyInput[];
  records: CostRecordInput[];
  heating: Record<string, number>;
  prepaymentsOperating: Record<string, number>;
  prepaymentsHeating: Record<string, number>;
}

export interface Position {
  record_id: string;
  cost_type: string;
  allocation_key: AllocationKey;
  total_cost: number;
  basis_tenant: number;
  basis_total: number;
  /** €/Einheit, ungerundet: total_cost / basis_total. */
  unit_price: number;
  share: number;
}

export interface TenantStatement {
  tenant_id: string;
  unit_id: string;
  occupancy_days: number;
  person_days: number;
  positions: Position[];
  total_share: number;
  heating_costs: number;
  prepayments_operating: number;
  prepayments_heating: number;
  balance: number;
  labor_35a_household: number;
  labor_35a_craftsman: number;
}

export interface OwnerPosition {
  record_id: string;
  cost_type: string;
  share: number;
  reason: "vacancy" | "non_apportionable";
}

export interface OwnerShare {
  positions: OwnerPosition[];
  total_share: number;
  labor_35a_household: number;
  labor_35a_craftsman: number;
}

export interface BillingResult {
  period_days: number;
  statements: TenantStatement[];
  owner: OwnerShare;
}

// --------------------------------------------------------------------------
// Datums-/Rundungshilfen
// --------------------------------------------------------------------------

/**
 * `YYYY-MM-DD` → fortlaufende Tagesnummer (UTC-basiert, zeitzonenfrei).
 * Null/undefined/ungültige Werte ergeben `NaN` (statt einen Fehler zu werfen),
 * damit nullable Datumsfelder die Berechnung nie zum Absturz bringen.
 */
export function toEpochDay(dateStr: string | null | undefined): number {
  if (typeof dateStr !== "string") return NaN;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return NaN;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return NaN;
  }
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Tage von `from` bis `to` inklusive (0, wenn ungültig oder to < from). */
export function daysInclusive(
  from: string | null | undefined,
  to: string | null | undefined,
): number {
  const a = toEpochDay(from);
  const b = toEpochDay(to);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const diff = b - a + 1;
  return diff > 0 ? diff : 0;
}

/** Überschneidungstage zweier inklusiver Intervalle (0 bei ungültigen Werten). */
export function overlapDays(
  aFrom: string | null | undefined,
  aTo: string | null | undefined,
  bFrom: string | null | undefined,
  bTo: string | null | undefined,
): number {
  const ea = toEpochDay(aFrom);
  const eb = toEpochDay(bFrom);
  const ec = toEpochDay(aTo);
  const ed = toEpochDay(bTo);
  if (![ea, eb, ec, ed].every((x) => Number.isFinite(x))) return 0;
  const from = ea > eb ? aFrom : bFrom;
  const to = ec < ed ? aTo : bTo;
  return daysInclusive(from, to);
}

/** Kaufmännische Rundung auf Cent (halb von der Null weg). */
export function roundCent(x: number): number {
  const cents = x * 100;
  const eps = cents >= 0 ? 1e-6 : -1e-6;
  return Math.round(cents + eps) / 100;
}

// --------------------------------------------------------------------------
// Belegung je Mietverhältnis
// --------------------------------------------------------------------------

export interface Occupancy {
  tenant_id: string;
  unit_id: string;
  occDays: number;
  personDays: number;
  occFrom: string;
  occTo: string;
}

/** Belegungs- und Personentage eines Mietverhältnisses im Zeitraum. */
export function computeOccupancy(
  tenancy: TenancyInput,
  periodStart: string,
  periodEnd: string,
): Occupancy {
  const occFrom =
    toEpochDay(tenancy.move_in) > toEpochDay(periodStart)
      ? tenancy.move_in
      : periodStart;
  const moveOut = tenancy.move_out ?? periodEnd;
  const occTo =
    toEpochDay(moveOut) < toEpochDay(periodEnd) ? moveOut : periodEnd;
  const occDays = daysInclusive(occFrom, occTo);

  let personDays: number;
  const periods = tenancy.person_periods ?? [];
  if (occDays === 0) {
    personDays = 0;
  } else if (periods.length > 0) {
    personDays = periods.reduce(
      (sum, p) => sum + p.persons * overlapDays(p.from, p.to, occFrom, occTo),
      0,
    );
  } else {
    personDays = tenancy.persons_count * occDays;
  }

  return {
    tenant_id: tenancy.tenant_id,
    unit_id: tenancy.unit_id,
    occDays,
    personDays,
    occFrom,
    occTo,
  };
}

// --------------------------------------------------------------------------
// Hauptberechnung
// --------------------------------------------------------------------------

export function calculateBilling(input: BillingInput): BillingResult {
  const periodDays = daysInclusive(input.period_start, input.period_end);

  const unitById = new Map(input.units.map((u) => [u.id, u]));
  const area = (unitId: string) => unitById.get(unitId)?.living_area ?? 0;
  const mea = (unitId: string) => unitById.get(unitId)?.ownership_share ?? 0;

  // Belegungen (nur Mietverhältnisse mit Überschneidung)
  const occ = input.tenancies
    .map((t) => computeOccupancy(t, input.period_start, input.period_end))
    .filter((o) => o.occDays > 0);

  // Repräsentative Personenzahl je Einheit (für Nenner „persons")
  const repPersonsByUnit = new Map<string, number>();
  for (const t of input.tenancies) {
    const prev = repPersonsByUnit.get(t.unit_id) ?? 0;
    if (t.persons_count > prev) repPersonsByUnit.set(t.unit_id, t.persons_count);
  }
  const repPersons = (unitId: string) => repPersonsByUnit.get(unitId) ?? 0;

  // Mieter-Basis je Schlüssel
  function tenantBasis(o: Occupancy, key: AllocationKey): number {
    switch (key) {
      case "living_area":
      case "consumption":
        return area(o.unit_id) * o.occDays;
      case "units":
        return o.occDays;
      case "ownership_share":
        return mea(o.unit_id) * o.occDays;
      case "persons":
        return o.personDays;
      default:
        return 0;
    }
  }

  // Theoretisches Maximum je Schlüssel (alle Einheiten × volle Tage)
  function theoreticalMax(key: AllocationKey): number {
    return input.units.reduce((sum, u) => {
      let measure = 0;
      switch (key) {
        case "living_area":
        case "consumption":
          measure = u.living_area ?? 0;
          break;
        case "units":
          measure = 1;
          break;
        case "ownership_share":
          measure = u.ownership_share ?? 0;
          break;
        case "persons":
          measure = repPersons(u.id);
          break;
        default:
          measure = 0;
      }
      return sum + measure * periodDays;
    }, 0);
  }

  const statements = new Map<string, TenantStatement>();
  for (const o of occ) {
    statements.set(o.tenant_id, {
      tenant_id: o.tenant_id,
      unit_id: o.unit_id,
      occupancy_days: o.occDays,
      person_days: o.personDays,
      positions: [],
      total_share: 0,
      heating_costs: roundCent(input.heating[o.tenant_id] ?? 0),
      prepayments_operating: roundCent(
        input.prepaymentsOperating[o.tenant_id] ?? 0,
      ),
      prepayments_heating: roundCent(input.prepaymentsHeating[o.tenant_id] ?? 0),
      balance: 0,
      labor_35a_household: 0,
      labor_35a_craftsman: 0,
    });
  }

  const owner: OwnerShare = {
    positions: [],
    total_share: 0,
    labor_35a_household: 0,
    labor_35a_craftsman: 0,
  };

  function addLabor(target: TenantStatement | OwnerShare, type: Type35a, v: number) {
    if (v === 0) return;
    if (type === "household_service") target.labor_35a_household += v;
    else if (type === "craftsman_service") target.labor_35a_craftsman += v;
  }

  for (const rec of input.records) {
    // Nicht umlagefähig → vollständig Eigentümer
    if (!rec.is_apportionable) {
      owner.positions.push({
        record_id: rec.id,
        cost_type: rec.cost_type,
        share: roundCent(rec.amount),
        reason: "non_apportionable",
      });
      addLabor(owner, rec.type_35a, roundCent(rec.labor_cost_35a));
      continue;
    }

    // Beteiligte Basen + Nenner ermitteln
    let participants: { o: Occupancy; basis: number }[];
    let denom: number;

    if (rec.allocation_key === "direct") {
      if (rec.tenant_id) {
        // Direktzuordnung an ein Mietverhältnis → 100 %, unabhängig von Miettagen.
        const o = occ.find((x) => x.tenant_id === rec.tenant_id);
        if (!o) {
          // Mietverhältnis nicht im Abrechnungszeitraum → Eigentümer.
          owner.positions.push({
            record_id: rec.id,
            cost_type: rec.cost_type,
            share: roundCent(rec.amount),
            reason: "vacancy",
          });
          addLabor(owner, rec.type_35a, roundCent(rec.labor_cost_35a));
          continue;
        }
        participants = [{ o, basis: 1 }];
        denom = 1;
      } else if (rec.unit_id) {
        participants = occ
          .filter((o) => o.unit_id === rec.unit_id)
          .map((o) => ({ o, basis: o.occDays }));
        denom = periodDays;
      } else {
        // Direktzuordnung ohne Einheit/Mietverhältnis → Eigentümer
        owner.positions.push({
          record_id: rec.id,
          cost_type: rec.cost_type,
          share: roundCent(rec.amount),
          reason: "vacancy",
        });
        addLabor(owner, rec.type_35a, roundCent(rec.labor_cost_35a));
        continue;
      }
    } else {
      participants = occ.map((o) => ({
        o,
        basis: tenantBasis(o, rec.allocation_key),
      }));
      denom = theoreticalMax(rec.allocation_key);
    }

    let distributed = 0;
    let distributedLabor = 0;

    if (denom > 0) {
      for (const { o, basis } of participants) {
        if (basis <= 0) continue;
        const share = roundCent((rec.amount * basis) / denom);
        const labor = roundCent((rec.labor_cost_35a * basis) / denom);
        const st = statements.get(o.tenant_id);
        if (!st) continue;
        st.positions.push({
          record_id: rec.id,
          cost_type: rec.cost_type,
          allocation_key: rec.allocation_key,
          total_cost: rec.amount,
          basis_tenant: basis,
          basis_total: denom,
          unit_price: rec.amount / denom,
          share,
        });
        addLabor(st, rec.type_35a, labor);
        distributed += share;
        distributedLabor += labor;
      }
    }

    // Rest = Leerstand/Eigentümer (gleicht Rundungsdifferenzen aus)
    const ownerShare = roundCent(rec.amount - distributed);
    if (ownerShare !== 0) {
      owner.positions.push({
        record_id: rec.id,
        cost_type: rec.cost_type,
        share: ownerShare,
        reason: "vacancy",
      });
    }
    const ownerLabor = roundCent(rec.labor_cost_35a - distributedLabor);
    addLabor(owner, rec.type_35a, ownerLabor);
  }

  // Summen & Saldo je Mieter
  const result: TenantStatement[] = [];
  for (const st of statements.values()) {
    st.total_share = roundCent(
      st.positions.reduce((s, p) => s + p.share, 0),
    );
    st.labor_35a_household = roundCent(st.labor_35a_household);
    st.labor_35a_craftsman = roundCent(st.labor_35a_craftsman);
    st.balance = roundCent(
      st.total_share +
        st.heating_costs -
        (st.prepayments_operating + st.prepayments_heating),
    );
    result.push(st);
  }

  owner.total_share = roundCent(
    owner.positions.reduce((s, p) => s + p.share, 0),
  );
  owner.labor_35a_household = roundCent(owner.labor_35a_household);
  owner.labor_35a_craftsman = roundCent(owner.labor_35a_craftsman);

  return { period_days: periodDays, statements: result, owner };
}
