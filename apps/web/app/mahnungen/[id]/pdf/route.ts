import { createClient } from "../../../../lib/supabase/server";
import { renderDunningLetterPdf } from "../../../../lib/pdf/dunningLetter";
import { loadDunningLetterData } from "../../../../lib/pdf/loadDunningLetter";

// @react-pdf/renderer benötigt die Node-Runtime; die Route ist request-abhängig.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  const data = await loadDunningLetterData(supabase, id);
  if (!data) {
    return new Response("Mahnung nicht gefunden.", { status: 404 });
  }

  const pdf = await renderDunningLetterPdf(data);

  const safeName = data.recipient.lastName.replace(/[^\p{L}\p{N}]+/gu, "_");
  const filename = `Mahnung-Stufe${data.level}-${safeName}.pdf`;

  // In einen ArrayBuffer-gestützten Uint8Array kopieren – Node liefert einen
  // Buffer über ArrayBufferLike, `Response` erwartet aber ArrayBuffer.
  const body = new Uint8Array(pdf.byteLength);
  body.set(pdf);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
