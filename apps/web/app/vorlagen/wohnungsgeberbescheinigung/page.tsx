import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadVorlagenData } from "@/lib/vorlagen/loadEntities";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WohnungsgeberForm } from "./WohnungsgeberForm";

export const metadata = {
  title: "Wohnungsgeberbescheinigung · Vorlagen · tefter",
};

export default async function WohnungsgeberPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { properties, sender } = await loadVorlagenData(supabase, user.id);

  return (
    <AppShell title="Wohnungsgeberbescheinigung" userEmail={user.email ?? ""}>
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/vorlagen">
          <ArrowLeft className="size-4" />
          Zurück zu den Vorlagen
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Wohnungsgeberbescheinigung
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bestätigung gemäß § 19 Bundesmeldegesetz (BMG) zur Vorlage bei der
          Meldebehörde.
        </p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Lege zunächst ein Objekt mit Einheit und Mieter an, um eine
            Bescheinigung zu erstellen.
          </CardContent>
        </Card>
      ) : (
        <WohnungsgeberForm properties={properties} sender={sender} />
      )}
    </AppShell>
  );
}
