"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { assertWriteAccess } from "../../lib/access";
import { parseDecimal } from "../../lib/parse";
import { renderDunningLetterPdf } from "../../lib/pdf/dunningLetter";
import { loadDunningLetterData } from "../../lib/pdf/loadDunningLetter";

export type DunningState = {
  error?: string;
  success?: string;
};

const STORAGE_BUCKET = "dunning";

/** Heutiges Datum als `YYYY-MM-DD` in lokaler Zeit. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/**
 * Erzeugt eine Mahnung: legt den Datensatz an, rendert das PDF über die
 * bestehende Render-Pipeline, lädt es in den privaten Bucket „dunning" und
 * hinterlegt den Pfad in `dunning_letters.pdf_url`.
 */
export async function createDunning(
  _prevState: DunningState,
  formData: FormData,
): Promise<DunningState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Bitte melde dich erneut an." };
  }
  const writeError = await assertWriteAccess(supabase, user.id);
  if (writeError) return { error: writeError };

  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const levelRaw = String(formData.get("level") ?? "").trim();
  const feeRaw = String(formData.get("fee") ?? "").trim();
  const paymentDeadline = String(formData.get("payment_deadline") ?? "").trim();

  if (!tenantId) {
    return { error: "Mietverhältnis konnte nicht ermittelt werden." };
  }

  const level = Number(levelRaw);
  if (!Number.isInteger(level) || level < 1 || level > 3) {
    return { error: "Die Mahnstufe muss 1, 2 oder 3 sein." };
  }

  const fee = feeRaw ? parseDecimal(feeRaw) : 0;
  if (fee === null || Number.isNaN(fee) || fee < 0) {
    return { error: "Die Mahngebühr muss eine Zahl ≥ 0 sein." };
  }

  const issuedAt = todayIso();
  if (!paymentDeadline || paymentDeadline <= issuedAt) {
    return { error: "Die Zahlungsfrist muss nach dem heutigen Tag liegen." };
  }

  // Offene Soll-Stellungen frisch berechnen (FIFO)
  const { data: openCharges, error: chargesError } = await supabase.rpc(
    "open_charges",
    { p_tenant_id: tenantId },
  );
  if (chargesError) {
    return {
      error: `Offene Forderungen konnten nicht ermittelt werden: ${chargesError.message}`,
    };
  }

  const charges = openCharges ?? [];
  const amountDue = charges.reduce(
    (sum, charge) => sum + (charge.open_amount ?? 0),
    0,
  );
  if (amountDue <= 0) {
    return { error: "Es bestehen keine offenen Forderungen für diesen Mieter." };
  }
  const coveredPeriods = charges.map((charge) => charge.period);

  // 1) Mahnung anlegen (Entwurf, noch ohne PDF)
  const { data: inserted, error: insertError } = await supabase
    .from("dunning_letters")
    .insert({
      user_id: user.id,
      tenant_id: tenantId,
      level,
      issued_at: issuedAt,
      payment_deadline: paymentDeadline,
      amount_due: amountDue,
      fee,
      covered_periods: coveredPeriods,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return {
      error: `Die Mahnung konnte nicht gespeichert werden: ${insertError?.message ?? "unbekannter Fehler"}`,
    };
  }

  const dunningId = inserted.id;
  const path = `${user.id}/${dunningId}.pdf`;

  // 2) PDF rendern (bestehende Pipeline)
  const data = await loadDunningLetterData(supabase, dunningId);
  if (!data) {
    await supabase.from("dunning_letters").delete().eq("id", dunningId);
    return { error: "Die Daten für das PDF konnten nicht geladen werden." };
  }
  const pdf = await renderDunningLetterPdf(data);

  // 3) In den privaten Bucket hochladen
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    // Rollback des Entwurfs, damit keine PDF-lose Mahnung zurückbleibt.
    await supabase.from("dunning_letters").delete().eq("id", dunningId);
    return {
      error: `Das PDF konnte nicht gespeichert werden: ${uploadError.message}. Ist der Bucket „dunning" (Migration 003) angelegt?`,
    };
  }

  // 4) Pfad hinterlegen
  await supabase
    .from("dunning_letters")
    .update({ pdf_url: path })
    .eq("id", dunningId);

  revalidatePath(`/mieteingang/${tenantId}`);
  redirect(`/mieteingang/${tenantId}`);
}

/** Markiert eine Mahnung als versendet (status = 'sent'). */
export async function markDunningSent(
  _prevState: DunningState,
  formData: FormData,
): Promise<DunningState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Bitte melde dich erneut an." };
  }
  const writeError = await assertWriteAccess(supabase, user.id);
  if (writeError) return { error: writeError };

  const id = String(formData.get("id") ?? "").trim();
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  if (!id) {
    return { error: "Mahnung konnte nicht ermittelt werden." };
  }

  const { error } = await supabase
    .from("dunning_letters")
    .update({ status: "sent" })
    .eq("id", id);

  if (error) {
    return { error: `Aktualisierung fehlgeschlagen: ${error.message}` };
  }

  if (tenantId) {
    revalidatePath(`/mieteingang/${tenantId}`);
  }
  return { success: "Mahnung als versendet markiert." };
}
