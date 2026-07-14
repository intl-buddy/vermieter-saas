"use server";

import { revalidatePath } from "next/cache";
import type { Database } from "@repo/core";
import { createClient } from "../../lib/supabase/server";

type PayerType = Database["public"]["Enums"]["payer_type"];

const PAYERS: readonly PayerType[] = ["tenant", "jobcenter", "other"];

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
  const paidAt = String(formData.get("paid_at") ?? "").trim();
  const payerRaw = String(formData.get("payer") ?? "").trim();
  const bankReference = String(formData.get("bank_reference") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!tenantId) {
    return { error: "Mietverhältnis konnte nicht ermittelt werden." };
  }
  if (!amountRaw || !paidAt) {
    return { error: "Bitte Betrag und Wertstellungsdatum angeben." };
  }

  const amount = parseAmount(amountRaw);
  // Negative Beträge sind erlaubt (Rückbuchung), nur 0 bzw. ungültig nicht.
  if (!Number.isFinite(amount) || amount === 0) {
    return { error: "Bitte einen gültigen Betrag ungleich 0 eingeben." };
  }

  const payer = PAYERS.includes(payerRaw as PayerType)
    ? (payerRaw as PayerType)
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
    paid_at: paidAt,
    payer,
    source: "manual",
    bank_reference: bankReference || null,
    notes: notes || null,
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
