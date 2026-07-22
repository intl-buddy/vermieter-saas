import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/account-context";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Wizard } from "./Wizard";
import { WizardErrorBoundary } from "./WizardErrorBoundary";

export const metadata = { title: "Nebenkostenabrechnung · tefter" };

export default async function AbrechnungNeuPage({
  searchParams,
}: {
  searchParams: Promise<{ objekt?: string }>;
}) {
  const { objekt } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);

  const { data: properties } = await supabase
    .from("properties")
    .select("id, name")
    .eq("user_id", uid)
    .order("name");

  return (
    <AppShell title="Nebenkostenabrechnung" userEmail={user.email ?? ""}>
      {!properties || properties.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Lege zuerst ein Objekt mit Einheiten und Mietern an.
          </CardContent>
        </Card>
      ) : (
        <WizardErrorBoundary>
          <Wizard properties={properties} defaultObjekt={objekt} />
        </WizardErrorBoundary>
      )}
    </AppShell>
  );
}
