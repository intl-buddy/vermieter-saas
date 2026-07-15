import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatInterval } from "../intervals";
import type { PropertyOption, UnitOption } from "../ScopeFields";
import { TemplateDialog } from "./TemplateDialog";
import { TemplateActiveToggle } from "./TemplateActiveToggle";

export const metadata = { title: "Wiederkehrende Aufgaben · tefter" };

export default async function WiederkehrendPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: properties }, { data: units }, { data: templates }] =
    await Promise.all([
      supabase.from("properties").select("id, name").order("name"),
      supabase.from("units").select("id, label, property_id").order("label"),
      supabase
        .from("task_templates")
        .select(
          "id, title, description, interval, day_of_month, month_of_year, is_active, property_id, unit_id",
        )
        .order("title"),
    ]);

  const propertyMap = new Map((properties ?? []).map((p) => [p.id, p.name]));
  const unitMap = new Map(
    (units ?? []).map((u) => [
      u.id,
      { label: u.label, property_id: u.property_id },
    ]),
  );

  const propertyOptions: PropertyOption[] = properties ?? [];
  const unitOptions: UnitOption[] = (units ?? []).map((u) => ({
    id: u.id,
    label: u.label,
    property_id: u.property_id,
    propertyName: propertyMap.get(u.property_id) ?? null,
  }));

  function scopeLabel(propertyId: string | null, unitId: string | null) {
    if (unitId) {
      const unit = unitMap.get(unitId);
      if (unit) {
        const pName = propertyMap.get(unit.property_id);
        return `${pName ? `${pName} · ` : ""}${unit.label}`;
      }
    }
    if (propertyId) return propertyMap.get(propertyId) ?? null;
    return "Alle Objekte";
  }

  return (
    <AppShell title="Wiederkehrende Aufgaben" userEmail={user.email ?? ""}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/aufgaben">
          <ArrowLeft className="size-4" />
          Zurück zu den Aufgaben
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Wiederkehrende Aufgaben
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vorlagen, aus denen automatisch Aufgaben erzeugt werden.
          </p>
        </div>
        <TemplateDialog
          mode="create"
          properties={propertyOptions}
          units={unitOptions}
        />
      </div>

      {!templates || templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-base font-medium">
              Noch keine wiederkehrenden Aufgaben
            </p>
            <p className="text-sm text-muted-foreground">
              Lege eine Vorlage an – die Aufgaben werden dann automatisch am
              Fälligkeitstag erzeugt.
            </p>
            <TemplateDialog
              mode="create"
              properties={propertyOptions}
              units={unitOptions}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((tpl) => (
            <Card key={tpl.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="font-medium">{tpl.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>{formatInterval(tpl)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="size-3.5" />
                      {scopeLabel(tpl.property_id, tpl.unit_id)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TemplateActiveToggle id={tpl.id} active={tpl.is_active} />
                  <TemplateDialog
                    mode="edit"
                    properties={propertyOptions}
                    units={unitOptions}
                    template={{
                      id: tpl.id,
                      title: tpl.title,
                      description: tpl.description,
                      interval: tpl.interval,
                      day_of_month: tpl.day_of_month,
                      month_of_year: tpl.month_of_year,
                      property_id: tpl.property_id,
                      unit_id: tpl.unit_id,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
