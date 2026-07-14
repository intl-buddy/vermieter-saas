"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@repo/core";
import { createClient } from "../../lib/supabase/server";

type RentPayer = Database["public"]["Enums"]["rent_payer"];

const PAYERS: readonly RentPayer[] = ["tenant", "jobcenter", "other"];

export type PaymentState = {
  error?: string;
  success?: string;
};

/** Wandelt eine Eingabe wie `1.234,50` oder `1234.50` in eine Zahl um. */
function parseAmount(raw: string): number {
  const trimmed = raw.trim();
  // Deutsche Schreibweise mit Dezimalkomma: Tausenderpunkte entfernen, Komma
  // zum Dezimalpunkt machen. Reine Punkt-Notation (z. B. aus <input
  // type="number">) bleibt unangetastet.
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  return Number(normalized);
}

/**
 * Erfasst eine neue Mietzahlung für einen Mieter. Der Datensatz wird mit der
 * `user_id` des eingeloggten Nutzers gespeichert (RLS). Nach dem Insert werden
 * die betroffenen Seiten neu validiert, sodass die Daten frisch geladen werden.
 */
export async function recordPayment(
  _prevState: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const tenantId = String(formData.get("tenant_id") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const valueDate = String(formData.get("value_date") ?? "").trim();
  const payerRaw = String(formData.get("payer") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!tenantId) {
    return { error: "Mietverhältnis konnte nicht ermittelt werden." };
  }
  if (!amountRaw || !valueDate) {
    return { error: "Bitte Betrag und Wertstellungsdatum angeben." };
  }

  const amount = parseAmount(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Bitte einen gültigen Betrag größer als 0 eingeben." };
  }

  const payer = PAYERS.includes(payerRaw as RentPayer)
    ? (payerRaw as RentPayer)
    : "tenant";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Bitte melde dich erneut an." };
  }

  const { error } = await supabase.from("rent_payments").insert({
    user_id: user.id,
    tenant_id: tenantId,
    amount,
    value_date: valueDate,
    payer,
    purpose: purpose || null,
    note: note || null,
  });

  if (error) {
    return {
      error: `Die Zahlung konnte nicht gespeichert werden: ${error.message}`,
    };
  }

  // Daten neu laden: Detailseite (Historie & offene Monate) und Übersicht.
  revalidatePath(`/mieteingang/${tenantId}`);
  revalidatePath("/mieteingang");

  return { success: "Zahlung wurde erfasst." };
}
