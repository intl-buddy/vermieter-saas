import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Euro, Users, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard · tefter" };

/** Heutiges Datum als `YYYY-MM-DD` in lokaler Zeit. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, propertiesCount, { data: balances }, { data: tasks }] =
    await Promise.all([
      supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true }),
      supabase.from("tenant_balances").select("balance"),
      supabase
        .from("generated_tasks")
        .select("status, due_date")
        .in("status", ["open", "overdue"]),
    ]);

  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    user.email?.split("@")[0] ||
    "";

  const objekteCount = propertiesCount.count ?? 0;
  const arrears = (balances ?? []).filter((b) => (b.balance ?? 0) > 0);
  const openTotal = arrears.reduce((sum, b) => sum + (b.balance ?? 0), 0);
  const arrearsCount = arrears.length;

  const today = todayIso();
  const openTasks = tasks ?? [];
  const openTasksCount = openTasks.length;
  const hasOverdue = openTasks.some(
    (t) => t.status === "overdue" || (t.status === "open" && t.due_date < today),
  );

  const kpis = [
    {
      label: "Objekte gesamt",
      value: String(objekteCount),
      icon: Building2,
      href: "/objekte",
      tone: "text-secondary-700",
      iconBg: "bg-secondary-100 text-secondary-700",
    },
    {
      label: "Offene Posten",
      value: formatCurrency(openTotal),
      icon: Euro,
      href: "/mieteingang",
      tone: "text-foreground",
      iconBg: "bg-primary-100 text-primary-700",
    },
    {
      label: "Mieter im Rückstand",
      value: String(arrearsCount),
      icon: Users,
      href: "/mieteingang",
      tone: arrearsCount > 0 ? "text-danger-600" : "text-foreground",
      iconBg:
        arrearsCount > 0
          ? "bg-danger-50 text-danger-600"
          : "bg-neutral-100 text-neutral-500",
    },
    {
      label: "Offene Aufgaben",
      value: String(openTasksCount),
      icon: ClipboardList,
      href: "/aufgaben",
      tone: hasOverdue ? "text-danger-600" : "text-foreground",
      iconBg: hasOverdue
        ? "bg-danger-50 text-danger-600"
        : "bg-gold-100 text-gold-700",
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.label} href={kpi.href} className="block">
              <Card className="h-full border-t-2 border-t-gold-400 transition-all hover:-translate-y-0.5 hover:shadow-md">
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
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
