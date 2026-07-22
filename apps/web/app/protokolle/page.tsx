import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/account-context";
import { formatDate } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  StartProtocolForm,
  type UnitOption,
  type PropertyOption,
} from "./StartProtocolForm";
import { TYPE_LABELS } from "./types";

export const metadata = { title: "Übergabeprotokolle · tefter" };

export default async function ProtokolleStartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);

  const [{ data: properties }, { data: units }, { data: tenants }] =
    await Promise.all([
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
      supabase
        .from("tenants")
        .select("id, unit_id, move_out_date")
        .eq("user_id", uid)
        .is("move_out_date", null),
    ]);

  const activeTenantByUnit = new Map<string, string>();
  for (const t of tenants ?? []) activeTenantByUnit.set(t.unit_id, t.id);

  const propertyOptions: PropertyOption[] = (properties ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));
  const unitOptions: UnitOption[] = (units ?? []).map((u) => ({
    id: u.id,
    label: u.label,
    propertyId: u.property_id,
    activeTenantId: activeTenantByUnit.get(u.id) ?? null,
  }));

  // Letzte Protokolle (Historie-Übersicht)
  const { data: protocols } = await supabase
    .from("handover_protocols")
    .select("id, unit_id, tenant_name, type, protocol_date, status")
    .eq("user_id", uid)
    .order("protocol_date", { ascending: false })
    .limit(20);

  const propertyNameByUnit = new Map<string, string>();
  const unitLabelById = new Map<string, string>();
  const propertyNameById = new Map(propertyOptions.map((p) => [p.id, p.name]));
  for (const u of units ?? []) {
    unitLabelById.set(u.id, u.label);
    propertyNameByUnit.set(u.id, propertyNameById.get(u.property_id) ?? "");
  }

  return (
    <AppShell title="Übergabeprotokolle" userEmail={user.email ?? ""}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Übergabeprotokolle
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wohnungsübergabe bei Ein- und Auszug – Schritt für Schritt am Handy,
          mit Fotos und Unterschriften.
        </p>
      </div>

      {unitOptions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Lege zuerst ein Objekt mit mindestens einer Einheit an, um ein
            Übergabeprotokoll zu erstellen.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 font-semibold">Neues Protokoll</h2>
            <StartProtocolForm
              properties={propertyOptions}
              units={unitOptions}
            />
          </CardContent>
        </Card>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Zuletzt erstellt</h2>
        {!protocols || protocols.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Noch keine Protokolle erstellt.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {protocols.map((p) => (
              <Link key={p.id} href={`/protokolle/${p.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div>
                      <div className="font-medium">
                        {propertyNameByUnit.get(p.unit_id) || "Objekt"} · Einheit{" "}
                        {unitLabelById.get(p.unit_id) || "–"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {TYPE_LABELS[p.type]} · {formatDate(p.protocol_date)} ·{" "}
                        {p.tenant_name || "—"}
                      </div>
                    </div>
                    <Badge variant={p.status === "completed" ? "success" : "neutral"}>
                      {p.status === "completed" ? "Abgeschlossen" : "Entwurf"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
