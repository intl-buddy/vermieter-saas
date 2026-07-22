import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertWriteAccess } from "@/lib/access";
import { getEffectiveUserId } from "@/lib/account-context";
import { sendBrevoEmail, tefterEmailShell } from "@/lib/email";
import { renderHandoverProtocolPdf } from "@/lib/pdf/handoverProtocol";
import { loadHandoverProtocolData } from "@/lib/pdf/loadHandoverProtocol";
import { TYPE_LABELS } from "@/app/protokolle/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROTOCOLS_BUCKET = "protocols";

function buildHtml(tenantName: string, senderName: string, typeLabel: string) {
  return tefterEmailShell(
    `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#14171a;">Guten Tag ${tenantName || ""},</p>
     <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#4e565b;">anbei erhalten Sie das Wohnungsübergabeprotokoll (${typeLabel}) zu Ihrer Wohnung als PDF. Bitte bewahren Sie es für Ihre Unterlagen auf.</p>
     <p style="margin:24px 0 0 0;font-size:15px;line-height:1.6;color:#14171a;">Mit freundlichen Grüßen<br />${senderName}</p>`,
  );
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

  let body: { protocolId?: string; email?: string; copyToLandlord?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const protocolId = String(body.protocolId ?? "").trim();
  if (!protocolId) {
    return NextResponse.json(
      { error: "Protokoll konnte nicht ermittelt werden." },
      { status: 400 },
    );
  }

  const { data: protocol } = await supabase
    .from("handover_protocols")
    .select("id, user_id, tenant_name, tenant_email, type, protocol_date, pdf_url")
    .eq("id", protocolId)
    .maybeSingle();
  if (!protocol || protocol.user_id !== uid) {
    return NextResponse.json(
      { error: "Protokoll nicht gefunden." },
      { status: 404 },
    );
  }

  const recipient =
    (body.email ?? "").trim() || (protocol.tenant_email ?? "").trim();
  if (!recipient) {
    return NextResponse.json(
      { error: "Keine E-Mail-Adresse hinterlegt." },
      { status: 400 },
    );
  }
  if (!EMAIL_REGEX.test(recipient)) {
    return NextResponse.json(
      { error: "Bitte eine gültige E-Mail-Adresse angeben." },
      { status: 400 },
    );
  }

  // Absenderprofil = Eigentümer (bei Verwaltung nicht der eingeloggte Nutzer).
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, company_name, email")
    .eq("id", uid)
    .maybeSingle();
  const senderName =
    profile?.company_name?.trim() || profile?.full_name?.trim() || "tefter";

  // PDF beschaffen: bevorzugt aus dem Storage, sonst frisch rendern.
  let pdfBytes: Uint8Array | null = null;
  if (protocol.pdf_url) {
    const { data: blob } = await supabase.storage
      .from(PROTOCOLS_BUCKET)
      .download(protocol.pdf_url);
    if (blob) pdfBytes = new Uint8Array(await blob.arrayBuffer());
  }
  if (!pdfBytes) {
    const data = await loadHandoverProtocolData(supabase, protocolId);
    if (!data) {
      return NextResponse.json(
        { error: "Das PDF konnte nicht erzeugt werden." },
        { status: 400 },
      );
    }
    pdfBytes = await renderHandoverProtocolPdf(data);
  }
  const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

  const typeLabel = TYPE_LABELS[protocol.type];
  const fileName = `Uebergabeprotokoll_${protocol.type}_${protocol.protocol_date}.pdf`;

  const bcc =
    body.copyToLandlord && profile?.email ? [profile.email] : undefined;

  const result = await sendBrevoEmail({
    to: recipient,
    toName: protocol.tenant_name || recipient,
    subject: `Wohnungsübergabeprotokoll (${typeLabel})`,
    html: buildHtml(protocol.tenant_name, senderName, typeLabel),
    replyTo: profile?.email ?? undefined,
    attachments: [{ content: pdfBase64, name: fileName }],
    bcc,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: `E-Mail konnte nicht versendet werden: ${result.error}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
