import { createClient } from "../../../../lib/supabase/server";
import {
  renderDunningLetterPdf,
  type DunningChargeRow,
} from "../../../../lib/pdf/dunningLetter";

// @react-pdf/renderer benötigt die Node-Runtime; die Route ist request-abhängig.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  // Mahnung laden (RLS stellt Eigentümerschaft sicher)
  const { data: letter } = await supabase
    .from("dunning_letters")
    .select(
      "id, tenant_id, level, issued_at, payment_deadline, amount_due, fee, covered_periods",
    )
    .eq("id", id)
    .maybeSingle();
  if (!letter) {
    return new Response("Mahnung nicht gefunden.", { status: 404 });
  }

  // Mieter → Einheit → Objekt
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, first_name, last_name, unit_id")
    .eq("id", letter.tenant_id)
    .maybeSingle();
  if (!tenant) {
    return new Response("Mietverhältnis nicht gefunden.", { status: 404 });
  }

  const { data: unit } = await supabase
    .from("units")
    .select("id, label, property_id")
    .eq("id", tenant.unit_id)
    .maybeSingle();
  if (!unit) {
    return new Response("Einheit nicht gefunden.", { status: 404 });
  }

  const { data: property } = await supabase
    .from("properties")
    .select("name, street, house_number, zip, city, rent_iban")
    .eq("id", unit.property_id)
    .maybeSingle();
  if (!property) {
    return new Response("Objekt nicht gefunden.", { status: 404 });
  }

  // Absender-/Profildaten
  const { data: profile } = await supabase
    .from("users")
    .select(
      "full_name, company_name, address_street, address_zip, address_city, iban, bank_name, bic",
    )
    .eq("id", user.id)
    .maybeSingle();

  // Offene Soll-Stellungen für die Forderungstabelle (FIFO)
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

  // Bankverbindung: rent_iban des Objekts hat Vorrang, sonst users.iban
  const iban = property.rent_iban ?? profile?.iban ?? null;

  const pdf = await renderDunningLetterPdf({
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
  });

  const safeName = tenant.last_name.replace(/[^\p{L}\p{N}]+/gu, "_");
  const filename = `Mahnung-Stufe${letter.level}-${safeName}.pdf`;

  // In einen ArrayBuffer-gestützten Uint8Array kopieren – Node liefert einen
  // Buffer über ArrayBufferLike, `Response` erwartet aber ArrayBuffer.
  const body = new Uint8Array(pdf.byteLength);
  body.set(pdf);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
