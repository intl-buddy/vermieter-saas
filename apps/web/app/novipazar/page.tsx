import Link from "next/link";
import { notFound } from "next/navigation";
import { LifeBuoy, ChevronRight } from "lucide-react";
import {
  parseAdminStats,
  parseCityStats,
  parseRevenueRows,
  computeRevenue,
  parseFunnelStats,
  parseFeatureUsage,
  parseMetricsHistory,
  parsePortfolio,
  percentage,
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
import { WeeklyRegistrationsChart } from "./WeeklyRegistrationsChart";
import { MrrHistoryChart } from "./MrrHistoryChart";
import { PortfolioHistogram } from "./PortfolioHistogram";

/** Katalog-Einträge (price_id → Monatsbeitrag + Intervall) aus PLANS+Env. */
function buildCatalogEntries() {
  const entries: {
    price_id: string;
    monthly_gross: number;
    billing_interval: "monthly" | "yearly";
  }[] = [];
  for (const plan of Object.values(PLANS)) {
    const monthlyId = process.env[plan.envMonthly];
    const yearlyId = process.env[plan.envYearly];
    if (monthlyId) {
      entries.push({
        price_id: monthlyId,
        monthly_gross: plan.priceMonthly,
        billing_interval: "monthly",
      });
    }
    if (yearlyId) {
      entries.push({
        price_id: yearlyId,
        monthly_gross: plan.priceYearlyPerMonth,
        billing_interval: "yearly",
      });
    }
  }
  return entries;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({
  label,
  total,
  last30,
}: {
  label: string;
  total: number;
  last30: number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <div className="text-2xl font-bold text-foreground">{total}</div>
        <div className="text-sm font-medium text-neutral-700">{label}</div>
        <div className="text-xs text-muted-foreground">
          davon letzte 30 Tage: {last30}
        </div>
      </CardContent>
    </Card>
  );
}

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

  // Preis-Katalog aktuell halten (aus PLANS+Env) und den heutigen Snapshot
  // idempotent auffrischen – so kennt der nächtliche Cron-MRR die Preise und der
  // Verlauf bekommt sofort einen aktuellen Punkt. Fehler bewusst ignorieren
  // (z. B. vor Migration 017) – das Dashboard darf daran nicht scheitern.
  await supabase.rpc("admin_sync_price_catalog", {
    p_entries: buildCatalogEntries(),
  });
  await supabase.rpc("capture_admin_snapshot");

  // Aggregate laden (die Funktionen prüfen serverseitig erneut auf is_admin).
  const [
    { data: statsData },
    { data: cityData },
    { data: revenueData },
    { data: funnelData },
    { data: usageData },
    { data: historyData },
    { data: portfolioData },
  ] = await Promise.all([
    supabase.rpc("admin_stats"),
    supabase.rpc("admin_stats_by_city"),
    supabase.rpc("admin_revenue_stats"),
    supabase.rpc("admin_funnel_stats"),
    supabase.rpc("admin_feature_usage"),
    supabase.rpc("admin_metrics_history"),
    supabase.rpc("admin_portfolio_distribution"),
  ]);

  const stats: AdminStats = parseAdminStats(statsData);
  const cities = parseCityStats(cityData);
  const revenue = computeRevenue(parseRevenueRows(revenueData), buildPriceMap());
  const funnel = parseFunnelStats(funnelData);
  const usage = parseFeatureUsage(usageData);
  const history = parseMetricsHistory(historyData);
  const portfolio = parsePortfolio(portfolioData);

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

      {/* Verwaltung */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Verwaltung</h2>
        <Link href="/novipazar/tickets" className="block">
          <Card className="border-t-2 border-t-secondary-400 transition-colors hover:bg-neutral-50">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                <LifeBuoy className="size-6" />
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-foreground">
                  Support-Tickets
                </div>
                <div className="text-sm text-muted-foreground">
                  Anfragen aller Nutzer beantworten und verwalten.
                </div>
              </div>
              <ChevronRight className="ml-auto size-5 shrink-0 text-neutral-400" />
            </CardContent>
          </Card>
        </Link>
      </section>

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

      {/* Funnel */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Funnel</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat
            label="mit ≥ 1 Objekt"
            value={`${percentage(funnel.usersWithObject, funnel.usersTotal)} %`}
          />
          <Stat
            label="mit aktivem Mietverhältnis"
            value={`${percentage(funnel.usersWithActiveTenancy, funnel.usersTotal)} %`}
          />
          <Stat
            label="Onboarding abgeschlossen"
            value={`${percentage(funnel.onboardingCompleted, funnel.usersTotal)} %`}
          />
          <Stat
            label="Trial → Paid Konversion"
            value={`${percentage(funnel.usersWithSub, funnel.usersTotal)} %`}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Ø Zeit bis zum ersten Abo:{" "}
          <strong className="font-semibold text-neutral-700">
            {funnel.avgTrialToPaidDays == null
              ? "–"
              : `${funnel.avgTrialToPaidDays} Tage`}
          </strong>{" "}
          (approximiert). Konversion = Anteil Nutzer mit Abo.
        </p>
        <Card className="mt-4">
          <CardContent className="p-5">
            <div className="mb-3 text-sm font-medium text-neutral-700">
              Registrierungen je Woche (letzte 12 Wochen)
            </div>
            <WeeklyRegistrationsChart data={funnel.registrationsWeekly} />
          </CardContent>
        </Card>
      </section>

      {/* Feature-Nutzung */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Feature-Nutzung</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <FeatureCard
            label="Mahnungen"
            total={usage.dunnings.total}
            last30={usage.dunnings.last30}
          />
          <FeatureCard
            label="NK-Abrechnungsläufe"
            total={usage.billingRuns.total}
            last30={usage.billingRuns.last30}
          />
          <FeatureCard
            label="Übergabeprotokolle"
            total={usage.protocols.total}
            last30={usage.protocols.last30}
          />
          <FeatureCard
            label="Belege"
            total={usage.receipts.total}
            last30={usage.receipts.last30}
          />
          <FeatureCard
            label="Aufgaben"
            total={usage.tasks.total}
            last30={usage.tasks.last30}
          />
        </div>
      </section>

      {/* MRR-Verlauf */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">MRR-Verlauf</h2>
        <Card>
          <CardContent className="p-5">
            <MrrHistoryChart data={history} />
          </CardContent>
        </Card>
      </section>

      {/* Portfolio-Verteilung */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">
          Portfoliogrößen (Nutzer nach Einheitenzahl)
        </h2>
        <Card>
          <CardContent className="p-5">
            <PortfolioHistogram rows={portfolio} />
          </CardContent>
        </Card>
      </section>

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
