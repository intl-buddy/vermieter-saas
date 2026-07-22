import Link from "next/link";
import { redirect } from "next/navigation";
import { Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/account-context";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { TaskItem, type TaskItemData } from "./TaskItem";
import type { PropertyOption, UnitOption } from "./ScopeFields";

export const metadata = { title: "Aufgaben · tefter" };

const TABS = [
  { key: "offen", label: "Offen" },
  { key: "ueberfaellig", label: "Überfällig" },
  { key: "erledigt", label: "Erledigt" },
] as const;

function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export default async function AufgabenPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const filter = TABS.some((t) => t.key === filterParam)
    ? (filterParam as (typeof TABS)[number]["key"])
    : "offen";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);

  const today = todayIso();

  // Objekte & Einheiten für Dialog und Scope-Anzeige
  const [{ data: properties }, { data: units }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name")
      .eq("user_id", uid)
      .order("name"),
    supabase
      .from("units")
      .select("id, label, property_id")
      .eq("user_id", uid)
      .order("label"),
  ]);

  const propertyMap = new Map((properties ?? []).map((p) => [p.id, p.name]));
  const unitMap = new Map(
    (units ?? []).map((u) => [
      u.id,
      {
        label: u.label,
        property_id: u.property_id,
        propertyName: propertyMap.get(u.property_id) ?? null,
      },
    ]),
  );

  const propertyOptions: PropertyOption[] = properties ?? [];
  const unitOptions: UnitOption[] = (units ?? []).map((u) => ({
    id: u.id,
    label: u.label,
    property_id: u.property_id,
    propertyName: propertyMap.get(u.property_id) ?? null,
  }));

  // Aufgaben nach Filter laden
  let query = supabase
    .from("generated_tasks")
    .select("id, title, description, due_date, status, property_id, unit_id")
    .eq("user_id", uid);

  if (filter === "erledigt") {
    query = query.eq("status", "done").order("due_date", { ascending: false });
  } else if (filter === "ueberfaellig") {
    query = query
      .or(`status.eq.overdue,and(status.eq.open,due_date.lt.${today})`)
      .order("due_date", { ascending: true });
  } else {
    query = query
      .eq("status", "open")
      .gte("due_date", today)
      .order("due_date", { ascending: true });
  }

  const { data: tasks } = await query;

  const items: TaskItemData[] = (tasks ?? []).map((t) => {
    const unit = t.unit_id ? unitMap.get(t.unit_id) : null;
    const propId = t.property_id ?? unit?.property_id ?? null;
    const scopeLabel = unit
      ? `${unit.propertyName ? `${unit.propertyName} · ` : ""}${unit.label}`
      : t.property_id
        ? (propertyMap.get(t.property_id) ?? null)
        : null;
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      dueDate: t.due_date,
      done: t.status === "done",
      overdue:
        t.status === "overdue" ||
        (t.status === "open" && t.due_date < today),
      scopeLabel,
      scopeHref: propId ? `/objekte/${propId}` : null,
      propertyId: t.property_id ?? null,
      unitId: t.unit_id ?? null,
    };
  });

  const emptyText: Record<string, string> = {
    offen: "Keine offenen Aufgaben – alles erledigt! 🎉",
    ueberfaellig: "Keine überfälligen Aufgaben. Sehr gut!",
    erledigt: "Noch keine Aufgaben erledigt.",
  };

  return (
    <AppShell title="Aufgaben" userEmail={user.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Aufgaben
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deine To-dos rund um die Verwaltung.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/aufgaben/wiederkehrend">
              <Repeat className="size-4" />
              Wiederkehrende
            </Link>
          </Button>
          <CreateTaskDialog properties={propertyOptions} units={unitOptions} />
        </div>
      </div>

      {/* Tab-Filter */}
      <div className="mb-5 inline-flex rounded-xl border border-neutral-200 bg-white p-1">
        {TABS.map((tab) => {
          const active = tab.key === filter;
          return (
            <Link
              key={tab.key}
              href={`/aufgaben?filter=${tab.key}`}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-neutral-600 hover:bg-neutral-50",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-base font-medium">{emptyText[filter]}</p>
            {filter !== "erledigt" ? (
              <CreateTaskDialog
                properties={propertyOptions}
                units={unitOptions}
              />
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              properties={propertyOptions}
              units={unitOptions}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
