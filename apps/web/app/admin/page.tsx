import { notFound } from "next/navigation";
import {
  parseAdminStats,
  parseCityStats,
  type AdminStats,
} from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { CityTable } from "./CityTable";
import { UnitsByCityChart } from "./UnitsByCityChart";

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
  const [{ data: statsData }, { data: cityData }] = await Promise.all([
    supabase.rpc("admin_stats"),
    supabase.rpc("admin_stats_by_city"),
  ]);

  const stats: AdminStats = parseAdminStats(statsData);
  const cities = parseCityStats(cityData);

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
