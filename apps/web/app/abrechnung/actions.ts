"use server";

import { revalidatePath } from "next/cache";
import {
  calculateBilling,
  computeOccupancy,
  daysInclusive,
  type AllocationKey,
  type BillingInput,
  type CostRecordInput,
  type TenancyInput,
  type Type35a,
} from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { assertWriteAccess } from "@/lib/access";
import { renderBillingStatementPdf } from "@/lib/pdf/billingStatement";
import { COST_TYPE_LABELS } from "@/app/belege/labels";

export type WizardUnit = {
  id: string;
  label: string;
  floor: string | null;
  living_area: number | null;
  ownership_share: number | null;
};
export type WizardTenancy = {
  tenant_id: string;
  unit_id: string;
  unit_label: string;
  first_name: string;
  last_name: string;
  move_in: string;
  move_out: string | null;
  persons_count: number;
  advance_mode: string;
};
export type WizardRecord = {
  id: string;
  cost_type: string;
  allocation_key: string;
  amount: number;
  is_apportionable: boolean;
  unit_id: string | null;
  labor_cost_35a: number;
  type_35a: string;
  billing_period_start: string;
  billing_period_end: string;
};
export type PersonPeriod = { from: string; to: string | null; persons: number };

export type WizardData = {
  property: {
    id: string;
    name: string;
    street: string;
    house_number: string;
    zip: string;
    city: string;
  };
  units: WizardUnit[];
  tenancies: WizardTenancy[];
  records: WizardRecord[];
  personPeriods: Record<string, PersonPeriod[]>;
  prepaymentsOperating: Record<string, number>;
  prepaymentsHeating: Record<string, number>;
  existingFinalized: boolean;
  periodStart: string;
  periodEnd: string;
};

export type FinalizePayload = {
  propertyId: string;
  periodStart: string;
  periodEnd: string;
  heating: Record<string, number>;
  personPeriods: Record<string, PersonPeriod[]>;
  prepaymentsOperating: Record<string, number>;
  prepaymentsHeating: Record<string, number>;
  prepaymentsSource: Record<string, string>;
};

async function assembleData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  propertyId: string,
  periodStart: string,
  periodEnd: string,
): Promise<WizardData | { error: string }> {
  const { data: property } = await supabase
    .from("properties")
    .select("id, name, street, house_number, zip, city")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property) return { error: "Objekt nicht gefunden." };

  const { data: units } = await supabase
    .from("units")
    .select("id, label, floor, living_area, ownership_share")
    .eq("property_id", propertyId)
    .order("label");
  const unitList = units ?? [];
  const unitIds = unitList.map((u) => u.id);
  const unitLabel = new Map(unitList.map((u) => [u.id, u.label]));

  let tenancies: WizardTenancy[] = [];
  const personPeriods: Record<string, PersonPeriod[]> = {};
  const prepaymentsOperating: Record<string, number> = {};
  const prepaymentsHeating: Record<string, number> = {};

  if (unitIds.length > 0) {
    const { data: tenants } = await supabase
      .from("tenants")
      .select(
        "id, unit_id, first_name, last_name, move_in_date, move_out_date, persons_count, advance_mode",
      )
      .in("unit_id", unitIds)
      .lte("move_in_date", periodEnd)
      .or(`move_out_date.is.null,move_out_date.gte.${periodStart}`);

    tenancies = (tenants ?? []).map((t) => ({
      tenant_id: t.id,
      unit_id: t.unit_id,
      unit_label: unitLabel.get(t.unit_id) ?? "",
      first_name: t.first_name,
      last_name: t.last_name,
      move_in: t.move_in_date,
      move_out: t.move_out_date,
      persons_count: t.persons_count,
      advance_mode: t.advance_mode,
    }));

    const tenantIds = tenancies.map((t) => t.tenant_id);
    if (tenantIds.length > 0) {
      const [{ data: pps }, { data: charges }] = await Promise.all([
        supabase
          .from("tenant_person_periods")
          .select("tenant_id, valid_from, valid_to, persons_count")
          .in("tenant_id", tenantIds)
          .order("valid_from"),
        supabase
          .from("rent_charges")
          .select("tenant_id, operating_costs_advance, heating_costs_advance")
          .in("tenant_id", tenantIds)
          .gte("period", periodStart)
          .lte("period", periodEnd),
      ]);

      for (const p of pps ?? []) {
        (personPeriods[p.tenant_id] ??= []).push({
          from: p.valid_from,
          to: p.valid_to,
          persons: p.persons_count,
        });
      }
      for (const c of charges ?? []) {
        prepaymentsOperating[c.tenant_id] =
          (prepaymentsOperating[c.tenant_id] ?? 0) + c.operating_costs_advance;
        prepaymentsHeating[c.tenant_id] =
          (prepaymentsHeating[c.tenant_id] ?? 0) + c.heating_costs_advance;
      }
    }
  }

  const { data: records } = await supabase
    .from("operating_costs_records")
    .select(
      "id, cost_type, allocation_key, amount, is_apportionable, unit_id, labor_cost_35a, type_35a, billing_period_start, billing_period_end",
    )
    .eq("property_id", propertyId)
    .lte("billing_period_start", periodEnd)
    .gte("billing_period_end", periodStart)
    .order("cost_type");

  const { count: finalizedCount } = await supabase
    .from("billing_runs")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .eq("status", "finalized")
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd);

  return {
    property,
    units: unitList,
    tenancies,
    // Nullable-Spalten (Migration 007/008) an der Grenze auf die
    // Nicht-Null-Erwartung des Wizards abbilden: null = kein 35a-Anteil.
    records: (records ?? []).map((r) => ({
      ...r,
      labor_cost_35a: r.labor_cost_35a ?? 0,
      type_35a: r.type_35a ?? "",
    })),
    personPeriods,
    prepaymentsOperating,
    prepaymentsHeating,
    existingFinalized: (finalizedCount ?? 0) > 0,
    periodStart,
    periodEnd,
  };
}

export async function loadWizardData(
  propertyId: string,
  periodStart: string,
  periodEnd: string,
): Promise<WizardData | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  if (!propertyId || !periodStart || !periodEnd) {
    return { error: "Objekt und Zeitraum sind erforderlich." };
  }
  return assembleData(supabase, propertyId, periodStart, periodEnd);
}

/** Baut die BillingInput-Struktur aus den geladenen/übergebenen Daten. */
function buildBillingInput(
  data: WizardData,
  heating: Record<string, number>,
  personPeriods: Record<string, PersonPeriod[]>,
  prepaymentsOperating: Record<string, number>,
  prepaymentsHeating: Record<string, number>,
): BillingInput {
  const tenancies: TenancyInput[] = data.tenancies.map((t) => ({
    tenant_id: t.tenant_id,
    unit_id: t.unit_id,
    move_in: t.move_in,
    move_out: t.move_out,
    persons_count: t.persons_count,
    person_periods: personPeriods[t.tenant_id],
  }));
  const records: CostRecordInput[] = data.records.map((r) => ({
    id: r.id,
    cost_type: r.cost_type,
    allocation_key: r.allocation_key as AllocationKey,
    amount: r.amount,
    is_apportionable: r.is_apportionable,
    unit_id: r.unit_id,
    labor_cost_35a: r.labor_cost_35a,
    type_35a: r.type_35a as Type35a,
  }));
  return {
    period_start: data.periodStart,
    period_end: data.periodEnd,
    units: data.units.map((u) => ({
      id: u.id,
      living_area: u.living_area,
      ownership_share: u.ownership_share,
    })),
    tenancies,
    records,
    heating,
    prepaymentsOperating,
    prepaymentsHeating,
  };
}

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const parts = iso.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export async function finalizeBilling(
  payload: FinalizePayload,
): Promise<{ runId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  const writeError = await assertWriteAccess(supabase, user.id);
  if (writeError) return { error: writeError };

  const data = await assembleData(
    supabase,
    payload.propertyId,
    payload.periodStart,
    payload.periodEnd,
  );
  if ("error" in data) return { error: data.error };
  if (data.tenancies.length === 0) {
    return { error: "Für diesen Zeitraum gibt es keine Mietverhältnisse." };
  }
  // Duplikatschutz: ein finalisierter Lauf je Objekt+Zeitraum genügt.
  if (data.existingFinalized) {
    return {
      error:
        "Für dieses Objekt und diesen Zeitraum existiert bereits eine Abrechnung – lösche sie zuerst in der Übersicht.",
    };
  }

  // Personenperioden persistieren (für die betroffenen Mieter ersetzen)
  const editedTenantIds = Object.keys(payload.personPeriods);
  if (editedTenantIds.length > 0) {
    await supabase
      .from("tenant_person_periods")
      .delete()
      .in("tenant_id", editedTenantIds);
    const rows = editedTenantIds.flatMap((tid) =>
      (payload.personPeriods[tid] ?? []).map((p) => ({
        user_id: user.id,
        tenant_id: tid,
        valid_from: p.from,
        valid_to: p.to,
        persons_count: p.persons,
      })),
    );
    if (rows.length > 0) {
      await supabase.from("tenant_person_periods").insert(rows);
    }
  }

  const input = buildBillingInput(
    data,
    payload.heating,
    payload.personPeriods,
    payload.prepaymentsOperating,
    payload.prepaymentsHeating,
  );
  const result = calculateBilling(input);

  const totalCosts =
    data.records.reduce((s, r) => s + r.amount, 0) +
    Object.values(payload.heating).reduce((s, v) => s + v, 0);

  // Absenderprofil + Bankverbindung
  const { data: profile } = await supabase
    .from("users")
    .select(
      "full_name, company_name, address_street, address_zip, address_city, iban, bank_name, bic",
    )
    .eq("id", user.id)
    .maybeSingle();
  const { data: propWithIban } = await supabase
    .from("properties")
    .select("rent_iban")
    .eq("id", payload.propertyId)
    .maybeSingle();
  const paymentIban = propWithIban?.rent_iban ?? profile?.iban ?? null;

  const { data: run, error: runError } = await supabase
    .from("billing_runs")
    .insert({
      user_id: user.id,
      property_id: payload.propertyId,
      period_start: payload.periodStart,
      period_end: payload.periodEnd,
      status: "finalized",
      total_costs: totalCosts,
      tenant_count: result.statements.length,
    })
    .select("id")
    .single();
  if (runError || !run) {
    return { error: `Abrechnungslauf fehlgeschlagen: ${runError?.message}` };
  }

  const tenancyById = new Map(data.tenancies.map((t) => [t.tenant_id, t]));
  const unitById = new Map(data.units.map((u) => [u.id, u]));
  const issueDate = todayIso();
  const deadline = addDaysIso(issueDate, 30);

  // Objekt-Verteilgrundlagen für das PDF
  const periodDays = daysInclusive(payload.periodStart, payload.periodEnd);
  const gesamtWohnflaeche = data.units.reduce(
    (s, u) => s + (u.living_area ?? 0),
    0,
  );
  const flaechentageGesamt = gesamtWohnflaeche * periodDays;
  const repPersonsByUnit = new Map<string, number>();
  for (const t of data.tenancies) {
    const prev = repPersonsByUnit.get(t.unit_id) ?? 0;
    if (t.persons_count > prev) repPersonsByUnit.set(t.unit_id, t.persons_count);
  }
  const personentageGesamt = data.units.reduce(
    (s, u) => s + (repPersonsByUnit.get(u.id) ?? 0) * periodDays,
    0,
  );
  const usedArea = data.records.some(
    (r) =>
      r.is_apportionable &&
      (r.allocation_key === "living_area" ||
        r.allocation_key === "consumption"),
  );
  const usedPersons = data.records.some(
    (r) => r.is_apportionable && r.allocation_key === "persons",
  );

  // Transaktionale Klammer: bei Fehler wird alles zurückgerollt
  // (Lauf + Statements via Cascade + bereits hochgeladene PDFs).
  const uploadedPaths: string[] = [];
  try {
    for (const st of result.statements) {
    const t = tenancyById.get(st.tenant_id);
    // Jede Abrechnungszeile stammt aus einem Mietverhältnis mit Einheit.
    if (!t) continue;
    const unit = unitById.get(t.unit_id);
    const occ = t
      ? computeOccupancy(
          {
            tenant_id: t.tenant_id,
            unit_id: t.unit_id,
            move_in: t.move_in,
            move_out: t.move_out,
            persons_count: t.persons_count,
          },
          payload.periodStart,
          payload.periodEnd,
        )
      : null;
    const periods = payload.personPeriods[st.tenant_id];
    const personsDisplay =
      periods && periods.length > 1
        ? "wechselnd"
        : String(t?.persons_count ?? 0);
    const unitArea = unit?.living_area ?? 0;
    const advanceMode = t?.advance_mode === "combined" ? "combined" : "split";
    const prepaySource =
      payload.prepaymentsSource[st.tenant_id] === "manual"
        ? "manual"
        : "calculated";

    // Snapshot mit vollem Rechenweg (defensiv: neue Läufe haben alle Felder)
    const snapshot = st.positions.map((p) => ({
      cost_type: p.cost_type,
      cost_label:
        COST_TYPE_LABELS[p.cost_type as keyof typeof COST_TYPE_LABELS] ??
        p.cost_type,
      allocation_key: p.allocation_key,
      total_cost: p.total_cost,
      basis_total: p.basis_total,
      basis_tenant: p.basis_tenant,
      unit_price: p.unit_price,
      share: p.share,
    }));

    const { data: statement, error: statementError } = await supabase
      .from("billing_statements")
      .insert({
        user_id: user.id,
        billing_run_id: run.id,
        tenant_id: st.tenant_id,
        unit_id: t?.unit_id ?? null,
        total_share: st.total_share,
        heating_costs: st.heating_costs,
        prepayments_operating: st.prepayments_operating,
        prepayments_heating: st.prepayments_heating,
        balance: st.balance,
        labor_35a_household: st.labor_35a_household,
        labor_35a_craftsman: st.labor_35a_craftsman,
        prepayments_source: prepaySource,
        occupancy_start: occ?.occFrom ?? null,
        occupancy_end: occ?.occTo ?? null,
        occupancy_days: st.occupancy_days,
        line_items: snapshot,
      })
      .select("id")
      .single();
    if (statementError || !statement) {
      throw new Error(statementError?.message ?? "Statement fehlgeschlagen");
    }

    // PDF rendern + hochladen
    const pdf = await renderBillingStatementPdf({
      sender: {
        fullName: profile?.full_name ?? "",
        companyName: profile?.company_name ?? null,
        addressStreet: profile?.address_street ?? null,
        addressZip: profile?.address_zip ?? null,
        addressCity: profile?.address_city ?? null,
      },
      recipient: {
        name: `${t?.first_name ?? ""} ${t?.last_name ?? ""}`.trim(),
        lastName: t?.last_name ?? "",
        street: `${data.property.street} ${data.property.house_number}`.trim(),
        zipCity: `${data.property.zip} ${data.property.city}`.trim(),
      },
      objekt: data.property.name,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      issueDate,
      tenant: {
        unitLabel: t?.unit_label ?? "",
        floor: unit?.floor ?? null,
        unitArea,
        personsDisplay,
        wohnzeitFrom: occ?.occFrom ?? payload.periodStart,
        wohnzeitTo: occ?.occTo ?? payload.periodEnd,
        wohntage: st.occupancy_days,
        ihreFlaechentage: unitArea * st.occupancy_days,
        ihrePersonentage: st.person_days,
      },
      object: {
        gesamtWohnflaeche,
        abrechnungstage: periodDays,
        flaechentageGesamt,
        personentageGesamt,
        usedArea,
        usedPersons,
      },
      positions: st.positions.map((p) => ({
        costLabel:
          COST_TYPE_LABELS[p.cost_type as keyof typeof COST_TYPE_LABELS] ??
          p.cost_type,
        totalCost: p.total_cost,
        allocationKey: p.allocation_key,
        basisTotal: p.basis_total,
        unitPrice: p.unit_price,
        basisTenant: p.basis_tenant,
        share: p.share,
      })),
      heatingCosts: st.heating_costs,
      totalShare: st.total_share,
      prepaymentsOperating: st.prepayments_operating,
      prepaymentsHeating: st.prepayments_heating,
      balance: st.balance,
      advanceMode,
      prepaymentsManual: prepaySource === "manual",
      labor35aHousehold: st.labor_35a_household,
      labor35aCraftsman: st.labor_35a_craftsman,
      payment: {
        iban: paymentIban,
        bankName: profile?.bank_name ?? null,
        bic: profile?.bic ?? null,
      },
      paymentDeadline: deadline,
    });

    const path = `${user.id}/${statement.id}.pdf`;
    const bytes = new Uint8Array(pdf.byteLength);
    bytes.set(pdf);
    const { error: uploadError } = await supabase.storage
      .from("statements")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) {
      throw new Error(`PDF-Upload fehlgeschlagen: ${uploadError.message}`);
    }
    uploadedPaths.push(path);
    await supabase
      .from("billing_statements")
      .update({ pdf_url: path })
      .eq("id", statement.id);
    }
  } catch (e) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("statements").remove(uploadedPaths);
    }
    // Löscht den Lauf und – via ON DELETE CASCADE – alle Statements.
    await supabase.from("billing_runs").delete().eq("id", run.id);
    return {
      error: `Abrechnung fehlgeschlagen und zurückgerollt: ${
        e instanceof Error ? e.message : "unbekannter Fehler"
      }`,
    };
  }

  revalidatePath("/abrechnung");
  return { runId: run.id };
}

/** Löscht einen Abrechnungslauf inkl. Statements (Cascade) und PDFs im Storage. */
export async function deleteBillingRun(
  runId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  const writeError = await assertWriteAccess(supabase, user.id);
  if (writeError) return { error: writeError };

  // PDF-Pfade der Statements ermitteln und aus dem Bucket entfernen.
  const { data: statements } = await supabase
    .from("billing_statements")
    .select("pdf_url")
    .eq("billing_run_id", runId);
  const paths = (statements ?? [])
    .map((s) => s.pdf_url)
    .filter((p): p is string => !!p);
  if (paths.length > 0) {
    await supabase.storage.from("statements").remove(paths);
  }

  // Löscht den Lauf und – via ON DELETE CASCADE – alle Statements.
  const { error } = await supabase
    .from("billing_runs")
    .delete()
    .eq("id", runId);
  if (error) return { error: `Löschen fehlgeschlagen: ${error.message}` };

  revalidatePath("/abrechnung");
  return {};
}
