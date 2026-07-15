"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { parseDecimal } from "@/lib/parse";
import { COST_TYPE_LABELS, ALLOCATION_OPTIONS } from "./labels";

type CostType = Database["public"]["Enums"]["operating_cost_type"];
type AllocationKey = Database["public"]["Enums"]["allocation_key"];

const COST_TYPES = Object.keys(COST_TYPE_LABELS) as CostType[];
const ALLOCATION_KEYS = ALLOCATION_OPTIONS.map((o) => o.value);
const VAT_RATES = [0, 7, 19];

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export type RecordState = {
  error?: string;
  success?: string;
};

/** Dateinamen auf sichere Zeichen reduzieren, Endung erhalten. */
function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\p{L}\p{N}.\-_]+/gu, "_");
  return cleaned.slice(-120) || "beleg";
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
    return { error: "Das Ende des Abrechnungszeitraums muss nach dem Start liegen." };
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

  // 1) Datensatz anlegen (noch ohne Beleg-URL)
  const { data: inserted, error: insertError } = await supabase
    .from("operating_costs_records")
    .insert({
      user_id: user.id,
      property_id: propertyId,
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
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return {
      error: `Speichern fehlgeschlagen: ${insertError?.message ?? "unbekannter Fehler"}`,
    };
  }

  // 2) Optionaler Datei-Upload in den privaten Bucket „receipts"
  const file = formData.get("receipt");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return {
        success:
          "Beleg gespeichert, aber die Datei ist zu groß (max. 10 MB). Bitte kleiner hochladen.",
      };
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return {
        success:
          "Beleg gespeichert, aber der Dateityp wird nicht unterstützt (nur PDF, JPG, PNG).",
      };
    }
    const path = `${user.id}/${inserted.id}/${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      return {
        success: `Beleg gespeichert, aber die Datei konnte nicht hochgeladen werden: ${uploadError.message}`,
      };
    }
    await supabase
      .from("operating_costs_records")
      .update({ receipt_url: path })
      .eq("id", inserted.id);
  }

  revalidatePath("/belege");
  revalidatePath(`/objekte/${propertyId}`);
  return { success: "Beleg wurde gespeichert." };
}
