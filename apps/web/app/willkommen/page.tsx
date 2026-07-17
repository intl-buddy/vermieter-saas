import { redirect } from "next/navigation";
import { firstUnfinishedStep, clampOnboardingStep } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { OnboardingClient } from "./OnboardingClient";
import type { AbsenderValues } from "./OnboardingAbsenderForm";

export const metadata = { title: "Willkommen · tefter" };
export const dynamic = "force-dynamic";

/** Nicht-leerer, getrimmter String? */
function filled(v: string | null | undefined): boolean {
  return Boolean(v && v.trim());
}

export default async function WillkommenPage({
  searchParams,
}: {
  searchParams: Promise<{ schritt?: string; fertig?: string }>;
}) {
  const { schritt, fertig } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Profil (Absenderdaten + Onboarding-Status) und das jüngste Objekt laden.
  const [{ data: profile }, { data: latestProperty }] = await Promise.all([
    supabase
      .from("users")
      .select(
        "full_name, company_name, address_street, address_zip, address_city, phone, iban, bank_name, bic, onboarding_completed",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("properties")
      .select("id, name")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const propertyId = latestProperty?.id ?? null;
  const propertyName = latestProperty?.name ?? null;

  // Jüngste Einheit des jüngsten Objekts (für die Mieter-Verknüpfung in Schritt 4).
  let unitId: string | null = null;
  let unitLabel: string | null = null;
  let hasTenant = false;
  if (propertyId) {
    const { data: latestUnit } = await supabase
      .from("units")
      .select("id, label")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    unitId = latestUnit?.id ?? null;
    unitLabel = latestUnit?.label ?? null;

    if (unitId) {
      const { count } = await supabase
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .eq("unit_id", unitId);
      hasTenant = (count ?? 0) > 0;
    }
  }

  // Ersten unerledigten Schritt aus den vorhandenen Daten ableiten.
  const firstUnfinished = firstUnfinishedStep({
    absender:
      filled(profile?.full_name) &&
      filled(profile?.address_street) &&
      filled(profile?.address_zip) &&
      filled(profile?.address_city),
    property: Boolean(propertyId),
    unit: Boolean(unitId),
    tenant: hasTenant,
  });

  // Erfolgs-Screen: explizit über ?fertig=1 oder wenn bereits abgeschlossen.
  const showSuccess = fertig === "1" || Boolean(profile?.onboarding_completed);

  // Angeforderten Schritt auf [1, firstUnfinished] begrenzen (kein Vorgreifen).
  const currentStep = clampOnboardingStep(
    schritt ? Number(schritt) : null,
    firstUnfinished,
  );

  const absender: AbsenderValues = {
    full_name: profile?.full_name ?? "",
    company_name: profile?.company_name ?? "",
    address_street: profile?.address_street ?? "",
    address_zip: profile?.address_zip ?? "",
    address_city: profile?.address_city ?? "",
    phone: profile?.phone ?? "",
    iban: profile?.iban ?? "",
    bank_name: profile?.bank_name ?? "",
    bic: profile?.bic ?? "",
  };

  return (
    <OnboardingClient
      step={currentStep}
      firstUnfinished={firstUnfinished}
      showSuccess={showSuccess}
      absender={absender}
      propertyId={propertyId}
      propertyName={propertyName}
      unitId={unitId}
      unitLabel={unitLabel}
    />
  );
}
