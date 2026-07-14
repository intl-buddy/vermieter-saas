import { redirect } from "next/navigation";
import { Building2, Euro, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard · tefter" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, propertiesCount, { data: balances }] =
    await Promise.all([
      supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true }),
      supabase.from("tenant_balances").select("balance"),
    ]);

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    user.email?.split("@")[0] ||
    "";

  const objekteCount = propertiesCount.count ?? 0;
  const arrears = (balances ?? []).filter((b) => (b.balance ?? 0) > 0);
  const openTotal = arrears.reduce((sum, b) => sum + (b.balance ?? 0), 0);
  const arrearsCount = arrears.length;

  const kpis = [
    {
      label: "Objekte gesamt",
      value: String(objekteCount),
      icon: Building2,
      tone: "text-secondary-700",
      iconBg: "bg-secondary-100 text-secondary-700",
    },
    {
      label: "Offene Posten",
      value: formatCurrency(openTotal),
      icon: Euro,
      tone: "text-foreground",
      iconBg: "bg-primary-100 text-primary-700",
    },
    {
      label: "Mieter im Rückstand",
      value: String(arrearsCount),
      icon: Users,
      tone: arrearsCount > 0 ? "text-danger-600" : "text-foreground",
      iconBg:
        arrearsCount > 0
          ? "bg-danger-50 text-danger-600"
          : "bg-neutral-100 text-neutral-500",
    },
  ];

  return (
    <AppShell title="Dashboard" userEmail={user.email ?? ""}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Hallo{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hier siehst du deine wichtigsten Kennzahlen auf einen Blick.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="flex flex-col gap-3 p-5">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    kpi.iconBg,
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div>
                  <div className={cn("text-2xl font-bold", kpi.tone)}>
                    {kpi.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {kpi.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
