import { createClient } from "@/lib/supabase/server";
import { renderWohnungsgeberPdf } from "@/lib/pdf/wohnungsgeberLetter";
import { pdfDownloadResponse, safeFilePart } from "@/lib/pdf/pdfResponse";
import type { LetterSender } from "@/lib/pdf/letterShared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  recipient?: { name?: string; street?: string; zipCity?: string };
  issuedAt?: string;
  wohnungAnschrift?: string;
  einheit?: string;
  einzugsdatum?: string;
  meldepflichtige?: string;
  filenamePart?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response("Ungültige Anfrage.", { status: 400 });
  }

  if (!body.issuedAt || !body.einzugsdatum) {
    return new Response("Pflichtangaben fehlen.", { status: 400 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select(
      "full_name, company_name, address_street, address_zip, address_city, pdf_footer_enabled",
    )
    .eq("id", user.id)
    .maybeSingle();

  const sender: LetterSender = {
    fullName: profile?.full_name ?? "",
    companyName: profile?.company_name ?? null,
    addressStreet: profile?.address_street ?? null,
    addressZip: profile?.address_zip ?? null,
    addressCity: profile?.address_city ?? null,
  };

  const pdf = await renderWohnungsgeberPdf({
    sender,
    recipient: {
      name: body.recipient?.name ?? "",
      street: body.recipient?.street ?? "",
      zipCity: body.recipient?.zipCity ?? "",
    },
    issuedAt: body.issuedAt,
    wohnungsgeber: sender.fullName,
    wohnungAnschrift: body.wohnungAnschrift ?? "",
    einheit: body.einheit ?? "",
    einzugsdatum: body.einzugsdatum,
    meldepflichtige: body.meldepflichtige ?? "",
    footerEnabled: profile?.pdf_footer_enabled ?? true,
  });

  return pdfDownloadResponse(
    pdf,
    `Wohnungsgeberbestaetigung-${safeFilePart(body.filenamePart ?? "Mieter")}.pdf`,
  );
}
