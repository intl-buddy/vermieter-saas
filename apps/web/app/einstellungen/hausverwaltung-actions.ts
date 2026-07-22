"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendBrevoEmail, tefterEmailShell } from "@/lib/email";

/** Ziel-Adresse der Hausverwaltung (Default auch in der DB-Spalte). */
const MANAGER_EMAIL = "info@oa-hausverwaltung.de";
const MANAGER_LABEL = "OA Hausverwaltung";

type LinkState = { error?: string; success?: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Zeitpunkt menschenlesbar (deutsch) für die Benachrichtigungs-Mail. */
function nowLabel(): string {
  return new Date().toLocaleString("de-DE", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

/**
 * Verknüpft das Konto des eingeloggten Owners mit der OA Hausverwaltung.
 * Legt einen aktiven `account_link` an und benachrichtigt die Hausverwaltung –
 * OHNE Zugangsdaten. Die Verarbeitung erfolgt im Rahmen eines
 * Verwaltungsauftrags zwischen Owner und Hausverwaltung.
 */
export async function linkAccount(): Promise<LinkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };

  // Bereits ein aktiver Link? Dann nichts tun.
  const { data: existing } = await supabase
    .from("account_links")
    .select("id")
    .eq("owner_user_id", user.id)
    .eq("manager_email", MANAGER_EMAIL)
    .eq("status", "active")
    .maybeSingle();
  if (existing) {
    revalidatePath("/einstellungen");
    return { success: "Dein Konto ist bereits verknüpft." };
  }

  const { error } = await supabase.from("account_links").insert({
    owner_user_id: user.id,
    manager_email: MANAGER_EMAIL,
    status: "active",
  });
  if (error) {
    return { error: `Verknüpfung fehlgeschlagen: ${error.message}` };
  }

  // Name des Owners für die Benachrichtigung.
  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const ownerName = profile?.full_name?.trim() || user.email || "Ein Nutzer";

  // Benachrichtigung an die Hausverwaltung – bewusst OHNE Zugangsdaten.
  await sendBrevoEmail({
    to: MANAGER_EMAIL,
    subject: `Neue tefter-Verknüpfung: ${ownerName}`,
    html: tefterEmailShell(
      `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#14171a;">Ein Nutzer hat sein tefter-Konto mit der ${MANAGER_LABEL} verknüpft.</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#4e565b;">
         <tr><td style="padding-right:12px;"><strong>Name:</strong></td><td>${ownerName}</td></tr>
         <tr><td style="padding-right:12px;"><strong>E-Mail:</strong></td><td>${user.email ?? "–"}</td></tr>
         <tr><td style="padding-right:12px;"><strong>Zeitpunkt:</strong></td><td>${nowLabel()}</td></tr>
       </table>
       <p style="margin:0;font-size:14px;line-height:1.6;color:#4e565b;">Nach dem nächsten Login unter dieser E-Mail-Adresse erscheint das Konto im Umschalter „Verwaltete Konten".</p>`,
    ),
  });

  revalidatePath("/einstellungen");
  return { success: "Dein Konto wurde mit der OA Hausverwaltung verknüpft." };
}

/**
 * Hebt die Verknüpfung wieder auf: setzt alle aktiven Links des Owners zur OA
 * Hausverwaltung auf `revoked`. Der Zugriff endet damit sofort (RLS). Die
 * Hausverwaltung wird informiert.
 */
export async function unlinkAccount(): Promise<LinkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };

  const { error } = await supabase
    .from("account_links")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("owner_user_id", user.id)
    .eq("manager_email", MANAGER_EMAIL)
    .eq("status", "active");
  if (error) {
    return { error: `Aufheben fehlgeschlagen: ${error.message}` };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  const ownerName = profile?.full_name?.trim() || user.email || "Ein Nutzer";

  await sendBrevoEmail({
    to: MANAGER_EMAIL,
    subject: `tefter-Verknüpfung aufgehoben: ${ownerName}`,
    html: tefterEmailShell(
      `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#14171a;">Ein Nutzer hat die Verknüpfung seines tefter-Kontos mit der ${MANAGER_LABEL} aufgehoben.</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#4e565b;">
         <tr><td style="padding-right:12px;"><strong>Name:</strong></td><td>${ownerName}</td></tr>
         <tr><td style="padding-right:12px;"><strong>E-Mail:</strong></td><td>${user.email ?? "–"}</td></tr>
         <tr><td style="padding-right:12px;"><strong>Zeitpunkt:</strong></td><td>${nowLabel()}</td></tr>
       </table>
       <p style="margin:0;font-size:14px;line-height:1.6;color:#4e565b;">Der Zugriff auf das Konto ist ab sofort beendet.</p>`,
    ),
  });

  revalidatePath("/einstellungen");
  return { success: "Die Verknüpfung wurde aufgehoben." };
}

type InquiryState = { error?: string; success?: string };

/**
 * Unverbindliche Kontaktanfrage an die OA Hausverwaltung („Verwaltung abgeben").
 * Speichert die Anfrage, übernimmt die Telefonnummer ins Profil (falls dort
 * leer) und benachrichtigt die Hausverwaltung per Brevo (replyTo = Nutzer).
 * Wiederholungsschutz: solange eine Anfrage 'new'/'contacted' ist, kein
 * erneutes Senden.
 */
export async function submitManagementInquiry(
  formData: FormData,
): Promise<InquiryState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Bitte melde dich erneut an." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) return { error: "Bitte gib deinen Namen an." };
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Bitte gib eine gültige E-Mail-Adresse an." };
  }
  if (phone.length < 6) {
    return { error: "Bitte gib eine gültige Telefonnummer an (min. 6 Zeichen)." };
  }

  // Wiederholungsschutz: offene Anfrage vorhanden?
  const { data: openInquiry } = await supabase
    .from("management_inquiries")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["new", "contacted"])
    .limit(1)
    .maybeSingle();
  if (openInquiry) {
    revalidatePath("/einstellungen");
    return { success: "Deine Anfrage liegt der OA Hausverwaltung bereits vor." };
  }

  const { error: insertError } = await supabase
    .from("management_inquiries")
    .insert({ user_id: user.id, name, email, phone, status: "new" });
  if (insertError) {
    return { error: `Anfrage fehlgeschlagen: ${insertError.message}` };
  }

  // Telefonnummer ins Profil übernehmen, falls dort noch keine hinterlegt ist.
  const [{ data: profile }, propertiesCount, unitsCount] = await Promise.all([
    supabase.from("users").select("phone").eq("id", user.id).maybeSingle(),
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("units").select("id", { count: "exact", head: true }),
  ]);
  if (!profile?.phone?.trim()) {
    await supabase.from("users").update({ phone }).eq("id", user.id);
  }

  const propCount = propertiesCount.count ?? 0;
  const unitCount = unitsCount.count ?? 0;

  // Benachrichtigung an die Hausverwaltung (Antwort geht direkt an den Nutzer).
  await sendBrevoEmail({
    to: MANAGER_EMAIL,
    replyTo: email,
    subject: `tefter-Anfrage Verwaltung: ${name}`,
    html: tefterEmailShell(
      `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#14171a;">Ein tefter-Nutzer möchte von der ${MANAGER_LABEL} zur Übernahme der Verwaltung kontaktiert werden.</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#4e565b;">
         <tr><td style="padding-right:12px;"><strong>Name:</strong></td><td>${name}</td></tr>
         <tr><td style="padding-right:12px;"><strong>E-Mail:</strong></td><td>${email}</td></tr>
         <tr><td style="padding-right:12px;"><strong>Telefon:</strong></td><td>${phone}</td></tr>
         <tr><td style="padding-right:12px;"><strong>Objekte:</strong></td><td>${propCount}</td></tr>
         <tr><td style="padding-right:12px;"><strong>Einheiten:</strong></td><td>${unitCount}</td></tr>
         <tr><td style="padding-right:12px;"><strong>Zeitpunkt:</strong></td><td>${nowLabel()}</td></tr>
       </table>
       <p style="margin:0;font-size:14px;line-height:1.6;color:#4e565b;">Eine Antwort auf diese E-Mail erreicht den Nutzer direkt.</p>`,
    ),
  });

  revalidatePath("/einstellungen");
  return { success: "Anfrage gesendet – wir melden uns bei dir!" };
}
