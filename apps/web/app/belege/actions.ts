"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@repo/core";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { assertWriteAccess } from "@/lib/access";
import { getEffectiveUserId } from "@/lib/account-context";
import { parseDecimal } from "@/lib/parse";
import { COST_TYPE_LABELS, ALLOCATION_OPTIONS } from "./labels";

type CostType = Database["public"]["Enums"]["operating_cost_type"];
type AllocationKey = Database["public"]["Enums"]["allocation_key"];
type RecordInsert = Database["public"]["Tables"]["operating_costs_records"]["Insert"];

const COST_TYPES = Object.keys(COST_TYPE_LABELS) as CostType[];
// „direct" ist im Dropdown nicht enthalten (ALLOCATION_OPTIONS), wird aber über
// die Untervarianten (Einheit / Mietverhältnis) gültig übermittelt.
const ALLOCATION_KEYS = [
  ...ALLOCATION_OPTIONS.map((o) => o.value),
  "direct" as AllocationKey,
];
const VAT_RATES = [0, 7, 19];

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];

export type RecordState = {
  error?: string;
  success?: string;
};

/** Dateinamen auf sichere Zeichen reduzieren, Endung erhalten. */
function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}.\-_]+/gu, "_");
  return cleaned.slice(-120) || "beleg";
}

type RecordFields = Omit<RecordInsert, "user_id" | "id" | "receipt_url">;

/** Gemeinsame Feldvalidierung für Anlegen und Bearbeiten. */
function readRecordFields(
  formData: FormData,
): { data: RecordFields } | { error: string } {
  const propertyId = String(formData.get("property_id") ?? "").trim();
  const costTypeRaw = String(formData.get("cost_type") ?? "").trim();
  const vendor = String(formData.get("vendor") ?? "").trim();
  const invoiceNumber = String(formData.get("invoice_number") ?? "").trim();
  const invoiceDate = String(formData.get("invoice_date") ?? "").trim();
  const paidDate = String(formData.get("paid_date") ?? "").trim();
  const grossRaw = String(formData.get("gross_amount") ?? "").trim();
  const vatRaw = String(formData.get("vat_rate") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const allocationRaw = String(formData.get("allocation_key") ?? "").trim();
  const unitIdRaw = String(formData.get("unit_id") ?? "").trim();
  const tenantIdRaw = String(formData.get("tenant_id") ?? "").trim();
  const periodStart = String(formData.get("billing_period_start") ?? "").trim();
  const periodEnd = String(formData.get("billing_period_end") ?? "").trim();
  const isApportionable =
    String(formData.get("is_apportionable") ?? "") === "true";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!propertyId) return { error: "Bitte ein Objekt auswählen." };
  if (!COST_TYPES.includes(costTypeRaw as CostType)) {
    return { error: "Bitte eine gültige Kostenart wählen." };
  }
  if (!invoiceDate) return { error: "Bitte das Rechnungsdatum angeben." };
  if (!periodStart || !periodEnd) {
    return { error: "Bitte den Abrechnungszeitraum angeben." };
  }
  if (periodEnd <= periodStart) {
    return {
      error: "Das Ende des Abrechnungszeitraums muss nach dem Start liegen.",
    };
  }

  const gross = grossRaw ? parseDecimal(grossRaw) : null;
  if (gross === null || Number.isNaN(gross) || gross < 0) {
    return { error: "Bitte einen gültigen Bruttobetrag (≥ 0) angeben." };
  }

  const amount = amountRaw ? parseDecimal(amountRaw) : gross;
  if (amount === null || Number.isNaN(amount) || amount < 0) {
    return { error: "Bitte einen gültigen umlagefähigen Betrag (≥ 0) angeben." };
  }

  const vatRate = vatRaw ? Number(vatRaw) : 19;
  if (!VAT_RATES.includes(vatRate)) {
    return { error: "USt-Satz muss 19, 7 oder 0 sein." };
  }

  const allocationKey = ALLOCATION_KEYS.includes(allocationRaw as AllocationKey)
    ? (allocationRaw as AllocationKey)
    : "living_area";

  // Direktzuordnung: entweder an eine Einheit ODER an ein Mietverhältnis.
  let unitId: string | null = null;
  let tenantId: string | null = null;
  if (allocationKey === "direct") {
    if (tenantIdRaw) {
      tenantId = tenantIdRaw;
    } else if (unitIdRaw) {
      unitId = unitIdRaw;
    } else {
      return {
        error:
          "Bitte für die Direktzuordnung eine Einheit oder ein Mietverhältnis wählen.",
      };
    }
  }

  return {
    data: {
      property_id: propertyId,
      unit_id: unitId,
      tenant_id: tenantId,
      cost_type: costTypeRaw as CostType,
      allocation_key: allocationKey,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      amount,
      gross_amount: gross,
      vat_rate: vatRate,
      is_apportionable: isApportionable,
      vendor: vendor || null,
      invoice_number: invoiceNumber || null,
      invoice_date: invoiceDate,
      paid_date: paidDate || null,
      notes: notes || null,
    },
  };
}

/** Beleg-Datei in den privaten Bucket laden. Gibt Pfad oder Hinweistext zurück. */
async function uploadReceipt(
  supabase: SupabaseServerClient,
  userId: string,
  recordId: string,
  file: File,
): Promise<{ path?: string; message?: string }> {
  if (file.size > MAX_FILE_BYTES) {
    return { message: "die Datei ist zu groß (max. 10 MB)" };
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return { message: "der Dateityp wird nicht unterstützt (nur PDF, JPG, PNG)" };
  }
  const path = `${userId}/${recordId}/${safeFileName(file.name)}`;
  const { error } = await supabase.storage
    .from("receipts")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) {
    return { message: `die Datei konnte nicht hochgeladen werden: ${error.message}` };
  }
  return { path };
}

export async function createRecord(
  _prevState: RecordState,
  formData: FormData,
): Promise<RecordState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);
  const writeError = await assertWriteAccess(supabase, uid);
  if (writeError) return { error: writeError };

  const fields = readRecordFields(formData);
  if ("error" in fields) return { error: fields.error };

  const { data: inserted, error: insertError } = await supabase
    .from("operating_costs_records")
    .insert({ user_id: uid, ...fields.data })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return {
      error: `Speichern fehlgeschlagen: ${insertError?.message ?? "unbekannter Fehler"}`,
    };
  }

  const file = formData.get("receipt");
  if (file instanceof File && file.size > 0) {
    const result = await uploadReceipt(supabase, uid, inserted.id, file);
    if (result.message) {
      return { success: `Beleg gespeichert, aber ${result.message}.` };
    }
    await supabase
      .from("operating_costs_records")
      .update({ receipt_url: result.path })
      .eq("id", inserted.id);
  }

  revalidatePath("/belege");
  revalidatePath(`/objekte/${fields.data.property_id}`);
  return { success: "Beleg wurde gespeichert." };
}

export async function updateRecord(
  _prevState: RecordState,
  formData: FormData,
): Promise<RecordState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);
  const writeError = await assertWriteAccess(supabase, uid);
  if (writeError) return { error: writeError };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Beleg konnte nicht ermittelt werden." };

  const fields = readRecordFields(formData);
  if ("error" in fields) return { error: fields.error };

  // Bestehenden Beleg (Datei-Pfad) laden – für ggf. Ersetzen der Datei.
  const { data: existing } = await supabase
    .from("operating_costs_records")
    .select("receipt_url")
    .eq("id", id)
    .maybeSingle();

  const { error: updateError } = await supabase
    .from("operating_costs_records")
    .update(fields.data)
    .eq("id", id);

  if (updateError) {
    return { error: `Speichern fehlgeschlagen: ${updateError.message}` };
  }

  // Neue Datei ersetzt die alte im Storage.
  const file = formData.get("receipt");
  if (file instanceof File && file.size > 0) {
    const result = await uploadReceipt(supabase, uid, id, file);
    if (result.message) {
      return { success: `Änderungen gespeichert, aber ${result.message}.` };
    }
    const oldPath = existing?.receipt_url ?? null;
    if (oldPath && oldPath !== result.path) {
      await supabase.storage.from("receipts").remove([oldPath]);
    }
    await supabase
      .from("operating_costs_records")
      .update({ receipt_url: result.path })
      .eq("id", id);
  }

  revalidatePath("/belege");
  revalidatePath(`/objekte/${fields.data.property_id}`);
  return { success: "Beleg wurde aktualisiert." };
}

/** Beleg samt zugehöriger Datei dauerhaft löschen. */
export async function deleteRecord(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);
  const writeError = await assertWriteAccess(supabase, uid);
  if (writeError) return { error: writeError };

  const { data: existing } = await supabase
    .from("operating_costs_records")
    .select("receipt_url, property_id")
    .eq("id", id)
    .maybeSingle();

  if (existing?.receipt_url) {
    await supabase.storage.from("receipts").remove([existing.receipt_url]);
  }

  const { error } = await supabase
    .from("operating_costs_records")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: `Löschen fehlgeschlagen: ${error.message}` };
  }

  revalidatePath("/belege");
  if (existing?.property_id) {
    revalidatePath(`/objekte/${existing.property_id}`);
  }
  return {};
}
