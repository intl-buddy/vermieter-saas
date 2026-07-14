import type { SupabaseServerClient } from "../supabase/server";
import type { DunningChargeRow, DunningLetterData } from "./dunningLetter";

/**
 * Lädt alle Daten für ein Mahnschreiben (Mahnung → Mieter → Einheit → Objekt →
 * Absenderprofil → offene Soll-Stellungen) und baut daraus die `DunningLetterData`
 * für den PDF-Renderer. RLS stellt sicher, dass nur eigene Datensätze sichtbar
 * sind; fehlt ein Teil, wird `null` zurückgegeben.
 *
 * Wird sowohl von der Render-Route als auch vom Mahnlauf verwendet.
 */
export async function loadDunningLetterData(
  supabase: SupabaseServerClient,
  letterId: string,
): Promise<DunningLetterData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: letter } = await supabase
    .from("dunning_letters")
    .select(
      "id, tenant_id, level, issued_at, payment_deadline, amount_due, fee, covered_periods",
    )
    .eq("id", letterId)
    .maybeSingle();
  if (!letter) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, first_name, last_name, unit_id")
    .eq("id", letter.tenant_id)
    .maybeSingle();
  if (!tenant) return null;

  const { data: unit } = await supabase
    .from("units")
    .select("id, label, property_id")
    .eq("id", tenant.unit_id)
    .maybeSingle();
  if (!unit) return null;

  const { data: property } = await supabase
    .from("properties")
    .select("name, street, house_number, zip, city, rent_iban")
    .eq("id", unit.property_id)
    .maybeSingle();
  if (!property) return null;

  // Absender = eingeloggter Nutzer (per RLS ohnehin nur die eigene Zeile).
  const { data: profile } = await supabase
    .from("users")
    .select(
      "full_name, company_name, address_street, address_zip, address_city, iban, bank_name, bic",
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: openCharges } = await supabase.rpc("open_charges", {
    p_tenant_id: tenant.id,
  });

  const coveredSet = new Set(letter.covered_periods ?? []);
  const relevantCharges =
    coveredSet.size > 0
      ? (openCharges ?? []).filter((charge) => coveredSet.has(charge.period))
      : (openCharges ?? []);

  const charges: DunningChargeRow[] = relevantCharges.map((charge) => ({
    period: charge.period,
    dueDate: charge.due_date,
    openAmount: charge.open_amount,
  }));

  // Bankverbindung: rent_iban des Objekts hat Vorrang, sonst users.iban.
  const iban = property.rent_iban ?? profile?.iban ?? null;

  return {
    level: letter.level,
    issuedAt: letter.issued_at,
    paymentDeadline: letter.payment_deadline,
    amountDue: letter.amount_due,
    fee: letter.fee,
    charges,
    sender: {
      fullName: profile?.full_name ?? "",
      companyName: profile?.company_name ?? null,
      addressStreet: profile?.address_street ?? null,
      addressZip: profile?.address_zip ?? null,
      addressCity: profile?.address_city ?? null,
    },
    recipient: {
      name: `${tenant.first_name} ${tenant.last_name}`.trim(),
      lastName: tenant.last_name,
      street: `${property.street} ${property.house_number}`.trim(),
      zipCity: `${property.zip} ${property.city}`.trim(),
      unitLabel: unit.label,
    },
    payment: {
      iban,
      bankName: profile?.bank_name ?? null,
      bic: profile?.bic ?? null,
    },
  };
}
