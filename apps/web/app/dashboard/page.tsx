import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  Euro,
  Users,
  ClipboardList,
  ClipboardPlus,
  Receipt,
  Calculator,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { CreateRecordDialog } from "@/app/belege/CreateRecordDialog";
import { CreateTaskDialog } from "@/app/aufgaben/CreateTaskDialog";
import { CheckoutToast } from "./CheckoutToast";
import { cn } from "@/lib/utils";

const ACTION_CARD_CLS =
  "group block w-full rounded-xl border border-neutral-200 border-t-2 border-t-gold-400 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md";

function QuickActionContent({
  icon: Icon,
  iconBg,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl",
          iconBg,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="mt-3 font-semibold text-foreground">{title}</div>
      <div className="text-sm text-muted-foreground">{subtitle}</div>
    </>
  );
}

export const metadata = { title: "Dashboard · tefter" };

/** Heutiges Datum als `YYYY-MM-DD` in lokaler Zeit. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [
    { data: profile },
    propertiesCount,
    { data: balances },
    { data: tasks },
    { data: propertyList },
    { data: unitList },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("tenant_balances").select("balance"),
    supabase
      .from("generated_tasks")
      .select("status, due_date")
      .in("status", ["open", "overdue"]),
    supabase.from("properties").select("id, name").order("name"),
    supabase.from("units").select("id, label, property_id").order("label"),
  ]);

  // Optionen für die wiederverwendeten Dialoge (Beleg / Aufgabe)
  const propertyOptions = propertyList ?? [];
  const propertyNameById = new Map(propertyOptions.map((p) => [p.id, p.name]));
  const unitOptions = (unitList ?? []).map((u) => ({
    id: u.id,
    label: u.label,
    property_id: u.property_id,
    propertyName: propertyNameById.get(u.property_id) ?? null,
  }));

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
      <CheckoutToast success={checkout === "success"} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Hallo{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hier siehst du deine wichtigsten Kennzahlen auf einen Blick.
        </p>
      </div>

      {profile && profile.onboarding_completed === false ? (
        <Link
          href="/willkommen"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold-300 bg-gold-50 px-5 py-4 transition-colors hover:bg-gold-100"
        >
          <div>
            <div className="font-semibold text-foreground">
              Einrichtung fortsetzen
            </div>
            <div className="text-sm text-muted-foreground">
              Schließe die geführte Einrichtung ab – Absenderdaten, erstes Objekt,
              Einheit und Mietverhältnis.
            </div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-secondary">
            Weiter →
          </span>
        </Link>
      ) : null}

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

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Schnellaktionen
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <CreateRecordDialog
            properties={propertyOptions}
            trigger={
              <button type="button" className={ACTION_CARD_CLS}>
                <QuickActionContent
                  icon={Receipt}
                  iconBg="bg-primary-100 text-primary-700"
                  title="Beleg erfassen"
                  subtitle="Rechnung hochladen und zuordnen"
                />
              </button>
            }
          />

          <Link href="/mieteingang" className={ACTION_CARD_CLS}>
            <QuickActionContent
              icon={Euro}
              iconBg="bg-secondary-100 text-secondary-700"
              title="Zahlung erfassen"
              subtitle="Mieteingang verbuchen"
            />
          </Link>

          <Link href="/abrechnung/neu" className={ACTION_CARD_CLS}>
            <QuickActionContent
              icon={Calculator}
              iconBg="bg-secondary-100 text-secondary-700"
              title="Nebenkostenabrechnung"
              subtitle="Betriebskosten abrechnen"
            />
          </Link>

          <CreateTaskDialog
            properties={propertyOptions}
            units={unitOptions}
            trigger={
              <button type="button" className={ACTION_CARD_CLS}>
                <QuickActionContent
                  icon={ClipboardPlus}
                  iconBg="bg-gold-100 text-gold-700"
                  title="Aufgabe anlegen"
                  subtitle="Einmalige Aufgabe erstellen"
                />
              </button>
            }
          />
        </div>
      </section>
    </AppShell>
  );
}
