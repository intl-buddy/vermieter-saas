"use server";

import { revalidatePath } from "next/cache";
import {
  PLANS,
  isPlanKey,
  isTicketCategory,
  TICKET_CATEGORY_LABELS,
  type TicketCategory,
} from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { sendBrevoEmail, tefterEmailShell } from "@/lib/email";

/** Support-Postfach – Ziel aller Ticket-Benachrichtigungen. */
const SUPPORT_INBOX = "service@tefter.de";

export type HilfeState = { error?: string; success?: string };

/** Anzeigename des Pakets für die interne Support-Mail. */
function planLabel(plan: string | null | undefined): string {
  if (!plan) return "–";
  if (plan === "trial") return "Testzeitraum";
  return isPlanKey(plan) ? PLANS[plan].name : plan; // z. B. "enterprise"
}

/** HTML-sicheres Escaping + Zeilenumbrüche als <br>. */
function toHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br />");
}

/**
 * Benachrichtigt das Support-Postfach über ein neues Ticket oder eine
 * Rückfrage. replyTo = Nutzer-Mail, damit direkt aus dem Postfach geantwortet
 * werden kann. Best-effort: Fehler blockieren die Aktion nicht (das Ticket ist
 * bereits gespeichert).
 */
async function notifySupport(params: {
  kind: "neu" | "antwort";
  category: TicketCategory;
  subject: string;
  message: string;
  userEmail: string;
  plan: string;
}): Promise<void> {
  const catLabel = TICKET_CATEGORY_LABELS[params.category];
  const heading =
    params.kind === "neu"
      ? "Neues Support-Ticket"
      : "Neue Rückfrage zu einem Ticket";
  const body = `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#14171a;font-weight:700;">${heading}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4e565b;">
      <tr><td style="padding:2px 12px 2px 0;color:#9aa2a8;">Kategorie</td><td style="padding:2px 0;">${toHtml(catLabel)}</td></tr>
      <tr><td style="padding:2px 12px 2px 0;color:#9aa2a8;">Betreff</td><td style="padding:2px 0;">${toHtml(params.subject)}</td></tr>
      <tr><td style="padding:2px 12px 2px 0;color:#9aa2a8;">Absender</td><td style="padding:2px 0;">${toHtml(params.userEmail)}</td></tr>
      <tr><td style="padding:2px 12px 2px 0;color:#9aa2a8;">Paket</td><td style="padding:2px 0;">${toHtml(params.plan)}</td></tr>
    </table>
    <div style="border-top:1px solid #eceff1;padding-top:16px;font-size:15px;line-height:1.6;color:#14171a;">${toHtml(params.message)}</div>
  `;
  await sendBrevoEmail({
    to: SUPPORT_INBOX,
    subject: `[tefter Support] ${catLabel}: ${params.subject}`,
    html: tefterEmailShell(body),
    replyTo: params.userEmail || undefined,
  });
}

/** Neues Ticket anlegen (auch im Lesemodus erlaubt – Support bleibt erreichbar). */
export async function createTicket(
  _prev: HilfeState,
  formData: FormData,
): Promise<HilfeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };

  const category = String(formData.get("category") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!isTicketCategory(category)) {
    return { error: "Bitte eine Kategorie wählen." };
  }
  if (!subject) return { error: "Bitte einen Betreff angeben." };
  if (!message) return { error: "Bitte beschreibe kurz dein Anliegen." };
  if (subject.length > 200) {
    return { error: "Der Betreff ist zu lang (max. 200 Zeichen)." };
  }

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: user.id, category, subject, message })
    .select("id")
    .single();

  if (error || !ticket) {
    return {
      error: `Konnte nicht gespeichert werden: ${error?.message ?? "unbekannter Fehler"}`,
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, plan")
    .eq("id", user.id)
    .maybeSingle();

  await notifySupport({
    kind: "neu",
    category,
    subject,
    message,
    userEmail: profile?.email ?? user.email ?? "",
    plan: planLabel(profile?.plan),
  });

  revalidatePath("/hilfe");
  return { success: "Wir melden uns per E-Mail bei dir." };
}

/** Rückfrage des Nutzers zu einem bestehenden Ticket. */
export async function addUserReply(
  _prev: HilfeState,
  formData: FormData,
): Promise<HilfeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };

  const ticketId = String(formData.get("ticket_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!ticketId) return { error: "Ticket nicht gefunden." };
  if (!message) return { error: "Bitte eine Nachricht eingeben." };

  // Ticket laden – RLS beschränkt bereits auf eigene Tickets, zusätzlich
  // expliziter Ownership-Check für eine klare Fehlermeldung.
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, user_id, subject, category")
    .eq("id", ticketId)
    .maybeSingle();
  if (!ticket || ticket.user_id !== user.id) {
    return { error: "Ticket nicht gefunden." };
  }

  const { error } = await supabase
    .from("ticket_messages")
    .insert({ ticket_id: ticketId, sender: "user", message });
  if (error) {
    return { error: `Konnte nicht gesendet werden: ${error.message}` };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, plan")
    .eq("id", user.id)
    .maybeSingle();

  await notifySupport({
    kind: "antwort",
    category: ticket.category,
    subject: ticket.subject,
    message,
    userEmail: profile?.email ?? user.email ?? "",
    plan: planLabel(profile?.plan),
  });

  revalidatePath("/hilfe");
  return { success: "Nachricht gesendet – wir melden uns per E-Mail." };
}
