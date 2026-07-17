import Link from "next/link";
import { Receipt, CheckCircle2 } from "lucide-react";
import {
  buildMonthlySeries,
  monthsWithData,
  currentMonthIst,
  openPositionsTotal,
  topOpenPositions,
  groupCostsByType,
  percentage,
} from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { COST_TYPE_LABELS } from "@/app/belege/labels";
import { SollIstChart } from "./SollIstChart";
import { CostDonut } from "./CostDonut";

/** `YYYY-MM-DD` für den 1. des Monats vor `monthsBack` Monaten (lokale Zeit). */
function firstOfMonthBack(now: Date, monthsBack: number): string {
  const d = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export async function StatsSection() {
  const supabase = await createClient();
  const now = new Date();
  const windowStart = firstOfMonthBack(now, 11); // 12 Monate inkl. aktuellem
  const yearStart = `${now.getFullYear()}-01-01`;

  // Alle Aggregationsquellen gebündelt laden (RLS-gescoped, kein N+1).
  const [
    { data: charges },
    { data: payments },
    { data: balances },
    { data: units },
    { data: activeTenants },
    { data: costs },
  ] = await Promise.all([
    supabase
      .from("rent_charges")
      .select(
        "period, total_amount, cold_rent, operating_costs_advance, heating_costs_advance",
      )
      .gte("period", windowStart),
    supabase.from("rent_payments").select("amount, paid_at").gte("paid_at", windowStart),
    supabase
      .from("tenant_balances")
      .select("tenant_id, first_name, last_name, unit_id, balance"),
    supabase.from("units").select("id, label, unit_type"),
    supabase.from("tenants").select("unit_id").is("move_out_date", null),
    supabase
      .from("operating_costs_records")
      .select("cost_type, gross_amount, amount, is_apportionable, paid_date")
      .gte("paid_date", yearStart),
  ]);

  // Soll vs. Ist (12 Monate)
  const series = buildMonthlySeries(
    (charges ?? []).map((c) => ({
      period: c.period,
      amount:
        c.total_amount ??
        c.cold_rent + c.operating_costs_advance + c.heating_costs_advance,
    })),
    (payments ?? []).map((p) => ({ paidAt: p.paid_at, amount: p.amount })),
    now,
  );
  const currentIst = currentMonthIst(series);
  const dataMonths = monthsWithData(series);

  // Offene Posten
  const balanceInputs = (balances ?? [])
    .filter((b) => b.tenant_id)
    .map((b) => ({
      tenantId: b.tenant_id as string,
      firstName: b.first_name,
      lastName: b.last_name,
      unitId: b.unit_id,
      balance: b.balance ?? 0,
    }));
  const openTotal = openPositionsTotal(balanceInputs);
  const topOpen = topOpenPositions(balanceInputs, 5);
  const unitLabelById = new Map((units ?? []).map((u) => [u.id, u.label]));

  // Vermietungsquote (Wohneinheiten, ohne Stellplätze)
  const nonParking = (units ?? []).filter((u) => u.unit_type !== "parking");
  const rentedUnitIds = new Set((activeTenants ?? []).map((t) => t.unit_id));
  const rentedNonParking = nonParking.filter((u) =>
    rentedUnitIds.has(u.id),
  ).length;
  const occupancy = percentage(rentedNonParking, nonParking.length);

  // Kostenstruktur (laufendes Jahr)
  const costInputs = (costs ?? []).map((r) => ({
    costType: r.cost_type,
    amount: r.gross_amount ?? r.amount,
    apportionable: r.is_apportionable,
  }));
  const { groups, total: costTotal } = groupCostsByType(costInputs);
  const costSlices = groups.map((g) => ({
    label:
      COST_TYPE_LABELS[g.costType as keyof typeof COST_TYPE_LABELS] ??
      g.costType,
    sum: g.sum,
    apportionable: g.apportionable,
  }));

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Deine Zahlen
      </h2>

      {/* KPI-Zeile */}
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1 p-5">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(currentIst)}
            </div>
            <div className="text-sm text-muted-foreground">
              Einnahmen laufender Monat
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-5">
            <div
              className={cn(
                "text-2xl font-bold",
                openTotal > 0 ? "text-danger-600" : "text-foreground",
              )}
            >
              {formatCurrency(openTotal)}
            </div>
            <div className="text-sm text-muted-foreground">
              Offene Posten gesamt
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="flex flex-col gap-1 p-5">
            <div className="text-2xl font-bold text-foreground">
              {occupancy} %
            </div>
            <div className="text-sm text-muted-foreground">
              Vermietungsquote
            </div>
            <div className="text-xs text-muted-foreground">
              {rentedNonParking} von {nonParking.length} Einheiten vermietet
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hauptchart: Soll vs. Ist */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 font-semibold">
            Mieteinnahmen – Soll vs. Ist (12 Monate)
          </div>
          {dataMonths < 3 ? (
            <div className="mb-3 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-sm text-neutral-700">
              Deine Auswertungen wachsen mit jedem Monat.
            </div>
          ) : null}
          <SollIstChart series={series} />
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Kostenstruktur */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="font-semibold">
                Kostenstruktur {now.getFullYear()}
              </span>
            </div>
            {costInputs.length === 0 ? (
              <div className="flex flex-col items-start gap-3 py-4">
                <p className="text-sm text-muted-foreground">
                  Noch keine Belege in diesem Jahr erfasst.
                </p>
                <Link
                  href="/belege"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-600"
                >
                  <Receipt className="size-4" />
                  Ersten Beleg erfassen
                </Link>
              </div>
            ) : (
              <CostDonut slices={costSlices} total={costTotal} />
            )}
          </CardContent>
        </Card>

        {/* Offene Posten nach Mieter */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 font-semibold">Offene Posten nach Mieter</div>
            {topOpen.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="size-8 text-success-600" />
                <p className="text-sm font-medium text-neutral-700">
                  Alle Mieten bezahlt – stark! 🎉
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {topOpen.map((b) => (
                  <li key={b.tenantId}>
                    <Link
                      href={`/mieteingang/${b.tenantId}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:border-primary"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {b.firstName} {b.lastName}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          Einheit{" "}
                          {(b.unitId && unitLabelById.get(b.unitId)) || "–"}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-danger-600">
                        {formatCurrency(b.balance)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
