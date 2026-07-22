import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadVorlagenData } from "@/lib/vorlagen/loadEntities";
import { getEffectiveUserId } from "@/lib/account-context";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MietvertragFlow } from "./MietvertragFlow";

export const metadata = { title: "Mietvertrag · Vorlagen · tefter" };

export default async function MietvertragPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);
  const { properties, sender } = await loadVorlagenData(supabase, uid);

  return (
    <AppShell title="Mietvertrag" userEmail={user.email ?? ""}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/vorlagen">
          <ArrowLeft className="size-4" />
          Zurück zu den Vorlagen
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Mietvertrag
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wohnraum- oder Gewerbemietvertrag als Mustervorlage – Vertragsdaten
          werden aus der Auswahl vorbefüllt.
        </p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Lege zunächst ein Objekt mit Einheit und Mieter an, um einen
            Mietvertrag zu erstellen.
          </CardContent>
        </Card>
      ) : (
        <MietvertragFlow properties={properties} sender={sender} />
      )}
    </AppShell>
  );
}
