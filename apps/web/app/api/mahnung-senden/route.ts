import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertWriteAccess } from "@/lib/access";
import { getEffectiveUserId } from "@/lib/account-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENDER_EMAIL = "noreply@tefter.de";

/** Betreff je Mahnstufe. */
function subjectFor(level: number, objekt: string): string {
  if (level <= 1) return `Zahlungserinnerung – ${objekt}`;
  if (level === 2) return `2. Mahnung – ${objekt}`;
  return `Letzte Mahnung – ${objekt}`;
}

/** Schlichtes HTML im tefter-Stil (Violett-Header, Gold-Trennlinie). */
function buildHtml(lastName: string, senderName: string): string {
  return `<!doctype html><html lang="de"><body style="margin:0;padding:0;background-color:#f7f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f8f8;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr><td align="center" style="background-color:#1e3a8a;padding:28px 24px;"><span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">tefter</span></td></tr>
          <tr><td style="height:3px;line-height:3px;font-size:0;background-color:#c2aa63;">&nbsp;</td></tr>
          <tr><td style="padding:36px 40px;">
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#14171a;">Sehr geehrte/r Frau/Herr ${lastName},</p>
            <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4e565b;">anbei erhalten Sie ein Schreiben Ihrer Hausverwaltung/Ihres Vermieters bezüglich ausstehender Mietzahlungen. Die Details entnehmen Sie bitte dem beigefügten Dokument.</p>
            <p style="margin:24px 0 0 0;font-size:15px;line-height:1.6;color:#14171a;">Mit freundlichen Grüßen<br />${senderName}</p>
          </td></tr>
        </table>
        <p style="margin:20px 0 0 0;font-size:12px;color:#9aa2a8;">© tefter · Immobilienverwaltung, einfach gemacht</p>
      </td></tr>
    </table>
  </body></html>`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);
  const writeError = await assertWriteAccess(supabase, uid);
  if (writeError) {
    return NextResponse.json({ error: writeError }, { status: 403 });
  }

  let body: { dunningId?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const dunningId = String(body.dunningId ?? "").trim();
  if (!dunningId) {
    return NextResponse.json(
      { error: "Mahnung konnte nicht ermittelt werden." },
      { status: 400 },
    );
  }

  // Mahnung laden – RLS + expliziter Ownership-Check.
  const { data: letter } = await supabase
    .from("dunning_letters")
    .select(
      "id, user_id, tenant_id, level, issued_at, amount_due, fee, status, pdf_url, notes",
    )
    .eq("id", dunningId)
    .maybeSingle();

  if (!letter || letter.user_id !== uid) {
    return NextResponse.json(
      { error: "Mahnung nicht gefunden." },
      { status: 404 },
    );
  }

  // Mieter + Objektname
  const { data: tenant } = await supabase
    .from("tenants")
    .select("first_name, last_name, email, unit_id")
    .eq("id", letter.tenant_id)
    .maybeSingle();
  if (!tenant) {
    return NextResponse.json(
      { error: "Mietverhältnis nicht gefunden." },
      { status: 404 },
    );
  }

  const recipient = (body.email ?? "").trim() || (tenant.email ?? "").trim();
  if (!recipient) {
    return NextResponse.json(
      { error: "Keine E-Mail-Adresse beim Mieter hinterlegt." },
      { status: 400 },
    );
  }
  if (!EMAIL_REGEX.test(recipient)) {
    return NextResponse.json(
      { error: "Bitte eine gültige E-Mail-Adresse angeben." },
      { status: 400 },
    );
  }

  let objektName = "Ihre Wohnung";
  const { data: unit } = await supabase
    .from("units")
    .select("property_id")
    .eq("id", tenant.unit_id)
    .maybeSingle();
  if (unit) {
    const { data: property } = await supabase
      .from("properties")
      .select("name")
      .eq("id", unit.property_id)
      .maybeSingle();
    if (property?.name) objektName = property.name;
  }

  // Absenderprofil = Eigentümer (bei Verwaltung nicht der eingeloggte Nutzer).
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, company_name, email")
    .eq("id", uid)
    .maybeSingle();
  const senderName =
    profile?.company_name?.trim() || profile?.full_name?.trim() || "tefter";
  const replyTo = profile?.email ?? undefined;

  // PDF aus dem Storage laden
  if (!letter.pdf_url) {
    return NextResponse.json(
      { error: "Zu dieser Mahnung ist kein PDF gespeichert." },
      { status: 400 },
    );
  }
  const { data: pdfBlob, error: downloadError } = await supabase.storage
    .from("dunning")
    .download(letter.pdf_url);
  if (downloadError || !pdfBlob) {
    return NextResponse.json(
      { error: "Das PDF konnte nicht geladen werden." },
      { status: 400 },
    );
  }
  const pdfBase64 = Buffer.from(await pdfBlob.arrayBuffer()).toString("base64");
  const fileName = `Mahnung_Stufe${letter.level}_${letter.issued_at.slice(0, 7)}.pdf`;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "E-Mail-Versand ist nicht konfiguriert (BREVO_API_KEY fehlt)." },
      { status: 500 },
    );
  }

  // Versand über Brevo
  const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: SENDER_EMAIL },
      replyTo: replyTo ? { email: replyTo } : undefined,
      to: [
        {
          email: recipient,
          name: `${tenant.first_name} ${tenant.last_name}`.trim(),
        },
      ],
      subject: subjectFor(letter.level, objektName),
      htmlContent: buildHtml(tenant.last_name, senderName),
      attachment: [{ content: pdfBase64, name: fileName }],
    }),
  });

  if (!brevoResponse.ok) {
    let detail = `HTTP ${brevoResponse.status}`;
    try {
      const err = await brevoResponse.json();
      if (err?.message) detail = err.message;
    } catch {
      // ignore
    }
    return NextResponse.json(
      { error: `E-Mail konnte nicht versendet werden: ${detail}` },
      { status: 502 },
    );
  }

  // Erfolg: Status auf 'sent' + Zeitstempel in notes
  const stamp = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  const entry = `Per E-Mail versendet am ${stamp} an ${recipient}`;
  const newNotes = [letter.notes?.trim(), entry].filter(Boolean).join("\n");

  await supabase
    .from("dunning_letters")
    .update({ status: "sent", notes: newNotes })
    .eq("id", dunningId);

  return NextResponse.json({ ok: true });
}
