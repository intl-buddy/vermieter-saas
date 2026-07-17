"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { assertWriteAccess } from "../../lib/access";

export type OnboardingState = {
  error?: string;
  success?: string;
};

/**
 * Schritt 1 des Onboardings: Absenderdaten (Name, Firma, Adresse, Telefon,
 * Bankverbindung). Schreibt bewusst NUR diese Spalten – anders als
 * `updateProfile` fasst diese Action die Mahnwesen-Felder nicht an, damit ein
 * Teil-Submit im Onboarding keine bestehenden Werte nullt.
 */
export async function saveAbsenderdaten(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Bitte melde dich erneut an." };
  }
  const writeError = await assertWriteAccess(supabase, user.id);
  if (writeError) return { error: writeError };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const addressStreet = String(formData.get("address_street") ?? "").trim();
  const addressZip = String(formData.get("address_zip") ?? "").trim();
  const addressCity = String(formData.get("address_city") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const iban = String(formData.get("iban") ?? "").trim();
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const bic = String(formData.get("bic") ?? "").trim();

  if (!fullName) {
    return { error: "Bitte gib deinen Namen an." };
  }

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      company_name: companyName || null,
      address_street: addressStreet || null,
      address_zip: addressZip || null,
      address_city: addressCity || null,
      phone: phone || null,
      iban: iban || null,
      bank_name: bankName || null,
      bic: bic || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: `Speichern fehlgeschlagen: ${error.message}` };
  }

  revalidatePath("/willkommen");
  return { success: "Absenderdaten gespeichert." };
}

/**
 * Schließt das Onboarding ab (setzt `onboarding_completed`), wird am Ende von
 * Schritt 4 aufgerufen – nachdem ein Mietverhältnis angelegt wurde ODER die
 * Einheit als leerstehend markiert wurde. Danach greift die
 * Post-Login-Weiterleitung nicht mehr.
 */
export async function completeOnboarding(): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Bitte melde dich erneut an." };
  }

  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (error) {
    return { error: `Abschluss fehlgeschlagen: ${error.message}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/willkommen");
  return { success: "Onboarding abgeschlossen." };
}
