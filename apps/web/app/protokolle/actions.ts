"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database, Json } from "@repo/core";
import { createClient } from "../../lib/supabase/server";
import { assertWriteAccess } from "../../lib/access";
import { getEffectiveUserId } from "../../lib/account-context";
import { renderHandoverProtocolPdf } from "../../lib/pdf/handoverProtocol";
import { loadHandoverProtocolData } from "../../lib/pdf/loadHandoverProtocol";
import type {
  ProtocolRoom,
  MeterReading,
  ProtocolKey,
  HandoverType,
} from "./types";

const PROTOCOLS_BUCKET = "protocols";

/** Heutiges Datum als `YYYY-MM-DD` in lokaler Zeit. */
function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/**
 * Legt einen Protokoll-Entwurf an (Schritt 0 des Wizards) und leitet in den
 * Wizard weiter. Aufgerufen von der Mieterkarte (Objektseite) und der
 * Startseite. `unit_id` ist Pflicht; `tenant_id` optional (Einzug vor
 * Mieteranlage → nur Name).
 */
export async function createProtocolDraft(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);
  const writeError = await assertWriteAccess(supabase, uid);
  if (writeError) {
    redirect("/protokolle?fehler=zugriff");
  }

  const unitId = String(formData.get("unit_id") ?? "").trim();
  const tenantIdRaw = String(formData.get("tenant_id") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "").trim();
  const type: HandoverType = typeRaw === "move_in" ? "move_in" : "move_out";

  if (!unitId) {
    redirect("/protokolle?fehler=einheit");
  }

  // Einheit muss dem Nutzer gehören (RLS + expliziter Check).
  const { data: unit } = await supabase
    .from("units")
    .select("id, user_id")
    .eq("id", unitId)
    .maybeSingle();
  if (!unit || unit.user_id !== uid) {
    redirect("/protokolle?fehler=einheit");
  }

  // Mieternamen aus dem Bestand vorbefüllen (Snapshot), falls tenant gewählt.
  let tenantName = "";
  let tenantEmail: string | null = null;
  let tenantId: string | null = null;
  if (tenantIdRaw) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, first_name, last_name, email")
      .eq("id", tenantIdRaw)
      .maybeSingle();
    if (tenant) {
      tenantId = tenant.id;
      tenantName = `${tenant.first_name} ${tenant.last_name}`.trim();
      tenantEmail = tenant.email;
    }
  }

  const { data: inserted, error } = await supabase
    .from("handover_protocols")
    .insert({
      user_id: uid,
      unit_id: unitId,
      tenant_id: tenantId,
      tenant_name: tenantName,
      tenant_email: tenantEmail,
      type,
      protocol_date: todayIso(),
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    redirect("/protokolle?fehler=anlegen");
  }

  redirect(`/protokolle/${inserted.id}`);
}

export type SaveStepResult = { ok: boolean; error?: string };

/** Felder, die ein Wizard-Schritt speichern darf (Teil-Update). */
export interface ProtocolStepPatch {
  type?: HandoverType;
  protocol_date?: string;
  tenant_id?: string | null;
  tenant_name?: string;
  tenant_email?: string | null;
  rooms?: ProtocolRoom[];
  meter_readings?: MeterReading[];
  keys?: ProtocolKey[];
  notes?: string | null;
  signature_landlord?: string | null;
  signature_tenant?: string | null;
}

/**
 * Speichert einen einzelnen Wizard-Schritt sofort als Entwurf. Nur die
 * übergebenen Felder werden geschrieben (Teil-Update) – so geht bei einem
 * Verbindungsabbruch nichts verloren und bereits erfasste Schritte bleiben
 * unangetastet. Abgeschlossene Protokolle sind schreibgeschützt.
 */
export async function saveProtocolStep(
  protocolId: string,
  patch: ProtocolStepPatch,
): Promise<SaveStepResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Bitte melde dich erneut an." };
  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);
  const writeError = await assertWriteAccess(supabase, uid);
  if (writeError) return { ok: false, error: writeError };

  const { data: existing } = await supabase
    .from("handover_protocols")
    .select("id, user_id, status")
    .eq("id", protocolId)
    .maybeSingle();
  if (!existing || existing.user_id !== uid) {
    return { ok: false, error: "Protokoll nicht gefunden." };
  }
  if (existing.status === "completed") {
    return { ok: false, error: "Das Protokoll ist bereits abgeschlossen." };
  }

  // Nur gesetzte Felder übernehmen (typisiertes Teil-Update).
  const update: Database["public"]["Tables"]["handover_protocols"]["Update"] = {};
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.protocol_date !== undefined) update.protocol_date = patch.protocol_date;
  if (patch.tenant_id !== undefined) update.tenant_id = patch.tenant_id;
  if (patch.tenant_name !== undefined) update.tenant_name = patch.tenant_name;
  if (patch.tenant_email !== undefined) update.tenant_email = patch.tenant_email;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.signature_landlord !== undefined)
    update.signature_landlord = patch.signature_landlord;
  if (patch.signature_tenant !== undefined)
    update.signature_tenant = patch.signature_tenant;
  if (patch.rooms !== undefined) update.rooms = patch.rooms as unknown as Json;
  if (patch.meter_readings !== undefined)
    update.meter_readings = patch.meter_readings as unknown as Json;
  if (patch.keys !== undefined) update.keys = patch.keys as unknown as Json;

  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase
    .from("handover_protocols")
    .update(update)
    .eq("id", protocolId);

  if (error) return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };

  revalidatePath(`/protokolle/${protocolId}`);
  return { ok: true };
}

export type CompleteResult = { ok: boolean; error?: string };

/**
 * Schließt das Protokoll ab: speichert den letzten Schritt, rendert das PDF
 * (inkl. Fotos + Unterschriften), lädt es in den Bucket „protocols" und setzt
 * status='completed' + pdf_url.
 */
export async function completeProtocol(
  protocolId: string,
  finalPatch: ProtocolStepPatch,
): Promise<CompleteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Bitte melde dich erneut an." };
  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);
  const writeError = await assertWriteAccess(supabase, uid);
  if (writeError) return { ok: false, error: writeError };

  // Letzten Schritt (i. d. R. Unterschriften) noch speichern.
  const saved = await saveProtocolStep(protocolId, finalPatch);
  if (!saved.ok) return { ok: false, error: saved.error };

  // PDF-Daten zusammenstellen und rendern.
  const data = await loadHandoverProtocolData(supabase, protocolId);
  if (!data) {
    return { ok: false, error: "Die Daten für das PDF konnten nicht geladen werden." };
  }
  const pdf = await renderHandoverProtocolPdf(data);

  const path = `${uid}/${protocolId}/protokoll.pdf`;
  const bytes = new Uint8Array(pdf.byteLength);
  bytes.set(pdf);
  const { error: uploadError } = await supabase.storage
    .from(PROTOCOLS_BUCKET)
    .upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    return {
      ok: false,
      error: `Das PDF konnte nicht gespeichert werden: ${uploadError.message}. Ist der Bucket „protocols" (Migration 014) angelegt?`,
    };
  }

  const { error: updateError } = await supabase
    .from("handover_protocols")
    .update({ status: "completed", pdf_url: path })
    .eq("id", protocolId);
  if (updateError) {
    return { ok: false, error: `Abschluss fehlgeschlagen: ${updateError.message}` };
  }

  revalidatePath(`/protokolle/${protocolId}`);
  return { ok: true };
}
