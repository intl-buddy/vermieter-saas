"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { parseDecimal, parseIntStrict } from "../../lib/parse";

export type ProfileState = {
  error?: string;
  success?: string;
};

/**
 * Aktualisiert das Vermieter-Profil (Absenderdaten für Mahnschreiben sowie
 * Standardwerte fürs Mahnwesen). Schreibt in `public.users` für den
 * eingeloggten Nutzer (RLS-Policy `users_self`).
 */
export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Bitte melde dich erneut an." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const addressStreet = String(formData.get("address_street") ?? "").trim();
  const addressZip = String(formData.get("address_zip") ?? "").trim();
  const addressCity = String(formData.get("address_city") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const iban = String(formData.get("iban") ?? "").trim();
  const bankName = String(formData.get("bank_name") ?? "").trim();
  const bic = String(formData.get("bic") ?? "").trim();
  const dunningFeeRaw = String(formData.get("dunning_fee") ?? "").trim();
  const dunningDeadlineRaw = String(
    formData.get("dunning_deadline_days") ?? "",
  ).trim();

  if (!fullName) {
    return { error: "Bitte gib deinen Namen an." };
  }

  const dunningFee = dunningFeeRaw ? parseDecimal(dunningFeeRaw) : 0;
  if (dunningFee === null || Number.isNaN(dunningFee) || dunningFee < 0) {
    return { error: "Die Mahngebühr muss eine Zahl ≥ 0 sein." };
  }

  const dunningDeadlineDays = dunningDeadlineRaw
    ? parseIntStrict(dunningDeadlineRaw)
    : 14;
  if (
    dunningDeadlineDays === null ||
    Number.isNaN(dunningDeadlineDays) ||
    dunningDeadlineDays < 1 ||
    dunningDeadlineDays > 90
  ) {
    return { error: "Die Zahlungsfrist muss zwischen 1 und 90 Tagen liegen." };
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
      dunning_fee: dunningFee,
      dunning_deadline_days: dunningDeadlineDays,
    })
    .eq("id", user.id);

  if (error) {
    return { error: `Speichern fehlgeschlagen: ${error.message}` };
  }

  revalidatePath("/einstellungen");
  return { success: "Profil wurde gespeichert." };
}
