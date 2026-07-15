import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Separator } from "@/components/ui/separator";
import { FooterLinks } from "@/components/footer-links";
import { EinstellungenForm } from "./EinstellungenForm";
import { KontoSection } from "./KontoSection";

export const metadata = { title: "Einstellungen · tefter" };

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select(
      "full_name, company_name, address_street, address_zip, address_city, phone, iban, bank_name, bic, dunning_fee, dunning_deadline_days",
    )
    .eq("id", user.id)
    .maybeSingle();

  const values = {
    full_name: profile?.full_name ?? "",
    company_name: profile?.company_name ?? null,
    address_street: profile?.address_street ?? null,
    address_zip: profile?.address_zip ?? null,
    address_city: profile?.address_city ?? null,
    phone: profile?.phone ?? null,
    iban: profile?.iban ?? null,
    bank_name: profile?.bank_name ?? null,
    bic: profile?.bic ?? null,
    dunning_fee: profile?.dunning_fee ?? 0,
    dunning_deadline_days: profile?.dunning_deadline_days ?? 14,
  };

  return (
    <AppShell title="Einstellungen" userEmail={user.email ?? ""}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Einstellungen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Dein Vermieter-Profil.</p>
      </div>

      <div className="mb-6 rounded-xl border border-secondary-100 bg-secondary-50 px-4 py-3 text-sm text-secondary-800">
        Diese Angaben erscheinen als Absender auf deinen Mahnschreiben.
      </div>

      <EinstellungenForm profile={values} />

      <div className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Konto</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          E-Mail-Adresse und Passwort ändern.
        </p>
        <KontoSection userEmail={user.email ?? ""} />
      </div>

      <Separator className="mt-12" />
      <div className="py-6">
        <FooterLinks className="justify-start" />
      </div>
    </AppShell>
  );
}
