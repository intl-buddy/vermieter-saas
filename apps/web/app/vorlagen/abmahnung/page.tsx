import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadVorlagenData } from "@/lib/vorlagen/loadEntities";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AbmahnungForm } from "./AbmahnungForm";

export const metadata = { title: "Abmahnung · Vorlagen · tefter" };

export default async function AbmahnungPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { properties, sender } = await loadVorlagenData(supabase, user.id);

  return (
    <AppShell title="Abmahnung" userEmail={user.email ?? ""}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/vorlagen">
          <ArrowLeft className="size-4" />
          Zurück zu den Vorlagen
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Abmahnung
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Objekt, Einheit und Mieter wählen, Grund und Sachverhalt ergänzen,
          Vorschau prüfen und PDF herunterladen.
        </p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Lege zunächst ein Objekt mit Einheit und Mieter an, um eine Abmahnung
            zu erstellen.
          </CardContent>
        </Card>
      ) : (
        <AbmahnungForm properties={properties} sender={sender} />
      )}
    </AppShell>
  );
}
