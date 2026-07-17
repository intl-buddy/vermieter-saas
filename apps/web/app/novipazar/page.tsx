import { notFound } from "next/navigation";
import {
  parseAdminStats,
  parseCityStats,
  parseRevenueRows,
  computeRevenue,
  PLANS,
  type AdminStats,
  type PriceMap,
} from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { CityTable } from "./CityTable";
import { UnitsByCityChart } from "./UnitsByCityChart";

/**
 * price_id → Preisinfo, aufgebaut aus PLANS (Preise) und den Env-Vars
 * (Stripe-price_ids). Bewusst hier im Server-Code: PLANS ist die einzige
 * Preisquelle (CLAUDE.md), die DB kennt keine Beträge – der MRR entsteht daher
 * aus den Roh-Zählungen der Funktion + diesem Mapping.
 */
function buildPriceMap(): PriceMap {
  const map: PriceMap = {};
  for (const plan of Object.values(PLANS)) {
    const monthlyId = process.env[plan.envMonthly];
    const yearlyId = process.env[plan.envYearly];
    if (monthlyId) {
      map[monthlyId] = {
        planKey: plan.key,
        planName: plan.name,
        interval: "monthly",
        grossPrice: plan.priceMonthly,
      };
    }
    if (yearlyId) {
      map[yearlyId] = {
        planKey: plan.key,
        planName: plan.name,
        interval: "yearly",
        grossPrice: plan.priceYearlyTotal,
      };
    }
  }
  return map;
}

export const metadata = { title: "Admin · tefter" };
export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="border-t-2 border-t-secondary-400">
      <CardContent className="flex flex-col gap-1 p-5">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm font-medium text-neutral-700">{label}</div>
        {sub ? <div className="text-xs text-muted-foreground">{sub}</div> : null}
      </CardContent>
    </Card>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guard: kein Nutzer oder kein Admin → 404 (Existenz nicht verraten, nicht 403).
  if (!user) notFound();
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile?.is_admin) notFound();

  // Aggregate laden (die Funktionen prüfen serverseitig erneut auf is_admin).
  const [{ data: statsData }, { data: cityData }, { data: revenueData }] =
    await Promise.all([
      supabase.rpc("admin_stats"),
      supabase.rpc("admin_stats_by_city"),
      supabase.rpc("admin_revenue_stats"),
    ]);

  const stats: AdminStats = parseAdminStats(statsData);
  const cities = parseCityStats(cityData);
  const revenue = computeRevenue(parseRevenueRows(revenueData), buildPriceMap());

  // Trials erzeugen keinen Umsatz – als Kontext eine konservative Schätzung:
  // Anzahl Trials × günstigster Monatspreis.
  const cheapestMonthly = Math.min(
    ...Object.values(PLANS).map((p) => p.priceMonthly),
  );
  const potentialTrialMrr = stats.usersTrial * cheapestMonthly;

  return (
    <AppShell title="Admin" userEmail={user.email ?? ""}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Admin-Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aggregierte Kennzahlen der Plattform.
        </p>
      </div>

      {/* Umsatz */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Umsatz</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="col-span-2 border-t-2 border-t-primary lg:col-span-1">
            <CardContent className="flex flex-col gap-1 p-5">
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(revenue.mrrGross)}
              </div>
              <div className="text-sm font-medium text-neutral-700">
                MRR (brutto)
              </div>
              <div className="text-xs text-muted-foreground">
                monatlich wiederkehrender Umsatz
              </div>
            </CardContent>
          </Card>
          <Kpi label="MRR (netto)" value={formatCurrency(revenue.mrrNet)} sub="ohne 19 % USt" />
          <Kpi label="ARR (brutto)" value={formatCurrency(revenue.arrGross)} sub="Jahresumsatz" />
          <Kpi label="Auslaufende Abos" value={String(revenue.churn)} sub="zum Periodenende gekündigt" />
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-semibold">Plan</th>
                <th className="px-4 py-2.5 text-right font-semibold">
                  Abos (monatl. / jährl.)
                </th>
                <th className="px-4 py-2.5 text-right font-semibold">MRR-Anteil</th>
              </tr>
            </thead>
            <tbody>
              {revenue.byPlan.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-4 text-center text-muted-foreground"
                  >
                    Noch keine aktiven Abos.
                  </td>
                </tr>
              ) : (
                revenue.byPlan.map((p) => (
                  <tr key={p.planKey} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{p.planName}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {p.monthly} / {p.yearly}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatCurrency(p.mrr)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {stats.usersTrial} Trials aktiv – potenzieller MRR bei Konversion:{" "}
          <strong className="font-semibold text-neutral-700">
            {formatCurrency(potentialTrialMrr)}
          </strong>{" "}
          (konservativ: günstigster Plan).
        </p>
      </section>

      {/* KPI-Kartenreihe */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Kpi
          label="Nutzer gesamt"
          value={String(stats.usersTotal)}
          sub={`+${stats.usersLast30} in 30 Tagen · +${stats.usersLast7} in 7 Tagen`}
        />
        <Kpi
          label="Aktive Abos / Trials"
          value={`${stats.usersActive} / ${stats.usersTrial}`}
          sub={`Lesemodus: ${stats.usersReadonly}`}
        />
        <Kpi label="Objekte" value={String(stats.propertiesTotal)} />
        <Kpi label="Einheiten" value={String(stats.unitsTotal)} />
        <Kpi
          label="Aktive Mietverhältnisse"
          value={String(stats.activeTenancies)}
        />
        <Kpi
          label="Kaltmieten / Monat"
          value={formatCurrency(stats.sumColdRent)}
          sub={`Vorauszahlungen: ${formatCurrency(stats.sumPrepayments)}`}
        />
      </div>

      {/* Städte-Tabelle */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Städte</h2>
        <CityTable rows={cities} />
      </section>

      {/* Balkendiagramm */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Einheiten je Stadt (Top 10)</h2>
        <Card>
          <CardContent className="p-5">
            <UnitsByCityChart rows={cities} />
          </CardContent>
        </Card>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">
        Aggregierte Werte über alle Nutzer – keine Einzeldaten.
      </p>
    </AppShell>
  );
}
