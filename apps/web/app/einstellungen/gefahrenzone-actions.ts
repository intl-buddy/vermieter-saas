"use server";

import { redirect } from "next/navigation";
import { scheduledDeletionDate } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { sendBrevoEmail, tefterEmailShell } from "@/lib/email";

export type DeletionState = { error?: string };

const DELETION_DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/**
 * Merkt die Selbstlöschung des Kontos vor: prüft das Passwort erneut
 * (Re-Authentifizierung), setzt `deletion_requested_at`, verschickt eine
 * Bestätigungsmail, loggt aus und leitet zur Abschiedsseite. Die eigentliche
 * Löschung erledigt der Lifecycle-Lauf nach 7 Tagen Karenz.
 */
export async function requestAccountDeletion(
  _prevState: DeletionState,
  formData: FormData,
): Promise<DeletionState> {
  const password = String(formData.get("password") ?? "");
  const confirmed = String(formData.get("confirm") ?? "") === "on";

  if (!confirmed) {
    return {
      error:
        "Bitte bestätige, dass du die unwiderrufliche Löschung verstanden hast.",
    };
  }
  if (!password) {
    return { error: "Bitte gib dein Passwort ein." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "Bitte melde dich erneut an." };
  }

  // Re-Authentifizierung: Passwort über Supabase prüfen.
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (authError) {
    return { error: "Das Passwort ist nicht korrekt." };
  }

  const nowIso = new Date().toISOString();
  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { error: updateError } = await supabase
    .from("users")
    .update({ deletion_requested_at: nowIso })
    .eq("id", user.id);
  if (updateError) {
    return {
      error: `Die Löschung konnte nicht vorgemerkt werden: ${updateError.message}`,
    };
  }

  // Bestätigungsmail (best effort – ein Mail-Fehler darf den Ablauf nicht stoppen).
  const delDateStr = DELETION_DATE_FORMAT.format(scheduledDeletionDate(nowIso));
  const name = profile?.full_name?.trim() || "Vermieter:in";
  const body = `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#14171a;">Hallo ${name},</p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4e565b;">
      wie gewünscht ist die Löschung deines tefter-Kontos vorgemerkt – zum <strong>${delDateStr}</strong> werden dein Konto und sämtliche Daten unwiderruflich gelöscht.
    </p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4e565b;">
      Du hast es dir anders überlegt? <strong>Melde dich einfach wieder an</strong> – der Login bricht die Löschung automatisch ab, und deine Daten bleiben erhalten.
    </p>
    <p style="margin:24px 0 0 0;font-size:15px;line-height:1.6;color:#14171a;">Dein tefter-Team</p>`;
  await sendBrevoEmail({
    to: user.email,
    toName: name,
    subject: `Deine tefter-Konto-Löschung ist vorgemerkt zum ${delDateStr}`,
    html: tefterEmailShell(body),
  });

  // Ausloggen und zur Abschiedsseite.
  await supabase.auth.signOut();
  redirect("/konto-geloescht");
}
