import { createHash } from "node:crypto";
import {
  getAccessStatus,
  READONLY_MONTHS,
  DELETION_GRACE_DAYS,
} from "@repo/core";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrevoEmail, tefterEmailShell } from "@/lib/email";
import { getStripe } from "@/lib/stripe";

type Admin = ReturnType<typeof createAdminClient>;

/** Speicher-Buckets, in denen nutzerbezogene Dateien unter `${userId}/…` liegen. */
const USER_BUCKETS = ["receipts", "dunning", "statements"] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Erinnerungsmails höchstens alle 30 Tage. */
const REMINDER_INTERVAL_DAYS = 30;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/** Löschdatum = Ende der Lesefrist + Karenz. */
function deletionDate(accessUntil: string): Date {
  return new Date(new Date(accessUntil).getTime() + DELETION_GRACE_DAYS * DAY_MS);
}

// ---------------------------------------------------------------------------
// 1) Trial-Ablauf / Abo-Ende → Lesemodus (access_until setzen)
// ---------------------------------------------------------------------------

export async function promoteExpiredToReadonly(
  admin: Admin,
  now: Date,
): Promise<number> {
  // Kandidaten: noch keine Lesefrist, nicht gelöscht, kein aktives Abo.
  const { data: candidates } = await admin
    .from("users")
    .select(
      "id, subscription_status, trial_ends_at, current_period_end, subscription_id, cancel_at_period_end",
    )
    .is("access_until", null)
    .is("deleted_at", null)
    .neq("subscription_status", "active");

  if (!candidates?.length) return 0;

  const until = new Date(now);
  until.setMonth(until.getMonth() + READONLY_MONTHS);
  const untilIso = until.toISOString();

  let count = 0;
  for (const u of candidates) {
    // Ohne Lesefrist wäre der Zugriff bereits erloschen? Dann Lesefrist geben.
    const status = getAccessStatus(
      {
        subscription_status: u.subscription_status,
        trial_ends_at: u.trial_ends_at,
        current_period_end: u.current_period_end,
        subscription_id: u.subscription_id,
        cancel_at_period_end: u.cancel_at_period_end,
        access_until: null,
      },
      now,
    );
    if (status !== "locked") continue;

    await admin.from("users").update({ access_until: untilIso }).eq("id", u.id);
    count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// 2) Erinnerungsmails an Lesemodus-Nutzer
// ---------------------------------------------------------------------------

export async function sendDeletionReminders(
  admin: Admin,
  now: Date,
): Promise<number> {
  const nowIso = now.toISOString();
  const { data: users } = await admin
    .from("users")
    .select("id, email, full_name, access_until, deletion_warned_at")
    .gt("access_until", nowIso)
    .is("deleted_at", null);

  if (!users?.length) return 0;

  const reminderCutoff = new Date(now.getTime() - REMINDER_INTERVAL_DAYS * DAY_MS);
  let sent = 0;

  for (const u of users) {
    if (!u.access_until || !u.email) continue;
    // Höchstens alle 30 Tage erinnern.
    if (
      u.deletion_warned_at &&
      new Date(u.deletion_warned_at).getTime() > reminderCutoff.getTime()
    ) {
      continue;
    }

    const delDate = deletionDate(u.access_until);
    const delDateStr = formatDate(delDate.toISOString());
    const name = u.full_name?.trim() || "Vermieter:in";

    const body = `
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#14171a;">Hallo ${name},</p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4e565b;">
        dein tefter-Abo ist beendet. Aktuell hast du noch <strong>Lesezugriff</strong> auf deine Daten – du kannst weiterhin alle Abrechnungen, Mahnungen und Belege einsehen und herunterladen.
      </p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4e565b;">
        Wenn du nicht reaktivierst, werden deine Daten am <strong>${delDateStr}</strong> unwiderruflich gelöscht.
      </p>
      <p style="margin:0 0 8px 0;font-size:15px;line-height:1.6;color:#4e565b;">Deine Möglichkeiten:</p>
      <ul style="margin:0 0 20px 0;padding-left:20px;font-size:15px;line-height:1.6;color:#4e565b;">
        <li><strong>Abo reaktivieren</strong> – in den Einstellungen unter „Abo".</li>
        <li><strong>Daten exportieren</strong> – in den Einstellungen unter „Deine Daten" als ZIP-Archiv.</li>
      </ul>
      <p style="margin:24px 0 0 0;font-size:15px;line-height:1.6;color:#14171a;">Dein tefter-Team</p>`;

    const result = await sendBrevoEmail({
      to: u.email,
      toName: name,
      subject: `Deine tefter-Daten werden am ${delDateStr} gelöscht`,
      html: tefterEmailShell(body),
    });

    if (result.ok) {
      await admin
        .from("users")
        .update({ deletion_warned_at: nowIso })
        .eq("id", u.id);
      sent++;
    }
  }
  return sent;
}

// ---------------------------------------------------------------------------
// 3) Endgültige Löschung nach Ablauf der Lesefrist + Karenz
// ---------------------------------------------------------------------------

/** Listet rekursiv alle Datei-Pfade unter einem Prefix in einem Bucket. */
async function listAllPaths(
  admin: Admin,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const out: string[] = [];
  const { data, error } = await admin.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });
  if (error || !data) return out;

  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Ordner haben keine id → rekursiv absteigen.
    if (entry.id === null) {
      out.push(...(await listAllPaths(admin, bucket, path)));
    } else {
      out.push(path);
    }
  }
  return out;
}

async function deleteUserStorage(admin: Admin, userId: string): Promise<void> {
  for (const bucket of USER_BUCKETS) {
    const paths = await listAllPaths(admin, bucket, userId);
    if (paths.length > 0) {
      await admin.storage.from(bucket).remove(paths);
    }
  }
}

export async function deleteExpiredUsers(
  admin: Admin,
  now: Date,
): Promise<number> {
  const cutoff = new Date(now.getTime() - DELETION_GRACE_DAYS * DAY_MS);
  const { data: users } = await admin
    .from("users")
    .select("id, email, full_name, stripe_customer_id, access_until")
    .lt("access_until", cutoff.toISOString())
    .is("deleted_at", null);

  if (!users?.length) return 0;

  let stripe: Stripe | null = null;
  try {
    stripe = getStripe();
  } catch {
    stripe = null; // Ohne Stripe-Key trotzdem löschen.
  }

  let deleted = 0;
  for (const u of users) {
    // 1) Letzte Bestätigungsmail (vor der Löschung, solange E-Mail bekannt).
    if (u.email) {
      const name = u.full_name?.trim() || "Vermieter:in";
      const body = `
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#14171a;">Hallo ${name},</p>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4e565b;">
          wie angekündigt haben wir dein tefter-Konto und alle zugehörigen Daten nun vollständig und unwiderruflich gelöscht.
        </p>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4e565b;">
          Falls du tefter künftig wieder nutzen möchtest, kannst du jederzeit ein neues Konto anlegen. Wir würden uns freuen.
        </p>
        <p style="margin:24px 0 0 0;font-size:15px;line-height:1.6;color:#14171a;">Dein tefter-Team</p>`;
      await sendBrevoEmail({
        to: u.email,
        toName: name,
        subject: "Deine tefter-Daten wurden gelöscht",
        html: tefterEmailShell(body),
      });
    }

    // 2) Storage-Dateien
    await deleteUserStorage(admin, u.id);

    // 3) Stripe-Customer
    if (stripe && u.stripe_customer_id) {
      try {
        await stripe.customers.del(u.stripe_customer_id);
      } catch {
        // Bereits gelöscht / nicht auffindbar → ignorieren.
      }
    }

    // 4) DSGVO-Nachweis (ohne Personenbezug) VOR der Löschung schreiben.
    const hash = createHash("sha256").update(u.id).digest("hex");
    await admin
      .from("deletion_log")
      .insert({ user_id_hash: hash, deleted_at: now.toISOString() });

    // 5) Geschäftsdaten löschen (kaskadiert über users → alle FKs).
    await admin.from("users").delete().eq("id", u.id);

    // 6) Auth-Eintrag entfernen (kein FK zu public.users → separat).
    try {
      await admin.auth.admin.deleteUser(u.id);
    } catch {
      // ignore
    }

    deleted++;
  }
  return deleted;
}

// ---------------------------------------------------------------------------
// Kompletter Tageslauf
// ---------------------------------------------------------------------------

export interface LifecycleResult {
  promotedToReadonly: number;
  remindersSent: number;
  usersDeleted: number;
}

export async function runLifecycle(now: Date): Promise<LifecycleResult> {
  const admin = createAdminClient();
  const promotedToReadonly = await promoteExpiredToReadonly(admin, now);
  const remindersSent = await sendDeletionReminders(admin, now);
  const usersDeleted = await deleteExpiredUsers(admin, now);
  return { promotedToReadonly, remindersSent, usersDeleted };
}
