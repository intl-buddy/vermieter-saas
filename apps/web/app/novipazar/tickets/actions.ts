"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { isTicketStatus, type TicketStatus } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import { sendBrevoEmail, tefterEmailShell } from "@/lib/email";
import { siteUrlFromHeaders } from "@/lib/site-url";

const SUPPORT_INBOX = "service@tefter.de";

export type AdminTicketState = { error?: string; success?: string };

/** Stellt sicher, dass der Aufrufer Admin ist (zusätzlich zur RPC-Prüfung). */
async function requireAdmin(): Promise<
  { supabase: SupabaseServerClient } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { error: "Nicht autorisiert." };
  return { supabase };
}

/** HTML-sicheres Escaping + Zeilenumbrüche als <br>. */
function toHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br />");
}

/** Support-Antwort: in den Verlauf schreiben UND dem Nutzer per Mail zustellen. */
export async function adminReply(
  _prev: AdminTicketState,
  formData: FormData,
): Promise<AdminTicketState> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };
  const { supabase } = guard;

  const ticketId = String(formData.get("ticket_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!ticketId) return { error: "Ticket nicht gefunden." };
  if (!message) return { error: "Bitte eine Antwort eingeben." };

  const { data, error } = await supabase.rpc("admin_reply_ticket", {
    p_ticket_id: ticketId,
    p_message: message,
  });
  if (error) return { error: `Konnte nicht gespeichert werden: ${error.message}` };

  const info = (data ?? {}) as { user_email?: string; subject?: string };
  const recipient = info.user_email ?? "";
  const subject = info.subject ?? "deinem Anliegen";

  if (recipient) {
    const link = `${siteUrlFromHeaders(await headers())}/hilfe`;
    const body = `
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#14171a;">Hallo,</p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4e565b;">wir haben auf dein Anliegen „${toHtml(subject)}“ geantwortet:</p>
      <div style="border-left:3px solid #c2aa63;padding:4px 0 4px 16px;margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#14171a;">${toHtml(message)}</div>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4e565b;">Du kannst direkt im Hilfebereich antworten und den Verlauf einsehen:</p>
      <p style="margin:0 0 8px 0;"><a href="${link}" style="display:inline-block;background-color:#2a9549;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:11px 22px;border-radius:10px;">Zum Hilfebereich</a></p>
    `;
    // replyTo = Support-Postfach, damit eine Mail-Antwort des Nutzers dort landet.
    await sendBrevoEmail({
      to: recipient,
      subject: `Antwort auf dein tefter-Ticket: ${subject}`,
      html: tefterEmailShell(body),
      replyTo: SUPPORT_INBOX,
    });
  }

  revalidatePath("/novipazar/tickets");
  return { success: "Antwort gesendet." };
}

/** Statuswechsel (Offen / In Bearbeitung / Beantwortet). */
export async function adminSetStatus(
  _prev: AdminTicketState,
  formData: FormData,
): Promise<AdminTicketState> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };
  const { supabase } = guard;

  const ticketId = String(formData.get("ticket_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!ticketId) return { error: "Ticket nicht gefunden." };
  if (!isTicketStatus(status)) return { error: "Ungültiger Status." };

  const { error } = await supabase.rpc("admin_set_ticket_status", {
    p_ticket_id: ticketId,
    p_status: status as TicketStatus,
  });
  if (error) return { error: `Fehlgeschlagen: ${error.message}` };

  revalidatePath("/novipazar/tickets");
  return { success: "Status aktualisiert." };
}

/** Interne Notiz setzen (nur für Admins sichtbar). */
export async function adminSetNote(
  _prev: AdminTicketState,
  formData: FormData,
): Promise<AdminTicketState> {
  const guard = await requireAdmin();
  if ("error" in guard) return { error: guard.error };
  const { supabase } = guard;

  const ticketId = String(formData.get("ticket_id") ?? "");
  const note = String(formData.get("note") ?? "");
  if (!ticketId) return { error: "Ticket nicht gefunden." };

  const { error } = await supabase.rpc("admin_set_ticket_note", {
    p_ticket_id: ticketId,
    p_note: note,
  });
  if (error) return { error: `Fehlgeschlagen: ${error.message}` };

  revalidatePath("/novipazar/tickets");
  return { success: "Notiz gespeichert." };
}
