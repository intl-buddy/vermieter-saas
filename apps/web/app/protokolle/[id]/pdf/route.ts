import { createClient } from "@/lib/supabase/server";
import { renderHandoverProtocolPdf } from "@/lib/pdf/handoverProtocol";
import { loadHandoverProtocolData } from "@/lib/pdf/loadHandoverProtocol";
import { safeFilePart } from "@/lib/pdf/pdfResponse";

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

  const data = await loadHandoverProtocolData(supabase, id);
  if (!data) {
    return new Response("Protokoll nicht gefunden.", { status: 404 });
  }

  const pdf = await renderHandoverProtocolPdf(data);
  const filename = `Uebergabeprotokoll_${safeFilePart(data.typeLabel)}_${data.date}.pdf`;

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
