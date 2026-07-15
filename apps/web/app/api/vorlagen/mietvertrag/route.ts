import { createClient } from "@/lib/supabase/server";
import { renderMietvertragPdf } from "@/lib/pdf/mietvertrag";
import { pdfDownloadResponse, safeFilePart } from "@/lib/pdf/pdfResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  mieterName?: string;
  mieterAnschrift?: string;
  mieterGeburtsdatum?: string;
  objektAdresseLage?: string;
  rooms?: string;
  mietbeginn?: string;
  grundmiete?: number;
  betriebskosten?: number;
  heizkosten?: number;
  advanceMode?: string;
  iban?: string;
  depositType?: string;
  depositAmount?: number;
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

  // Vermieter authentisch aus dem eigenen Profil.
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, address_street, address_zip, address_city")
    .eq("id", user.id)
    .maybeSingle();

  const vermieterName = profile?.full_name ?? "";
  const vermieterAnschrift = [
    profile?.address_street,
    [profile?.address_zip, profile?.address_city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const pdf = await renderMietvertragPdf({
    vermieterName,
    vermieterAnschrift,
    mieterName: body.mieterName ?? "",
    mieterAnschrift: body.mieterAnschrift ?? "",
    mieterGeburtsdatum: body.mieterGeburtsdatum ?? "",
    objektAdresseLage: body.objektAdresseLage ?? "",
    rooms: body.rooms ?? "____",
    mietbeginn: body.mietbeginn ?? "",
    grundmiete: Number(body.grundmiete ?? 0),
    betriebskosten: Number(body.betriebskosten ?? 0),
    heizkosten: Number(body.heizkosten ?? 0),
    advanceMode: body.advanceMode ?? "split",
    kontoinhaber: vermieterName,
    iban: body.iban ?? "",
    depositType: body.depositType ?? "cash_deposit",
    depositAmount: Number(body.depositAmount ?? 0),
  });

  return pdfDownloadResponse(
    pdf,
    `Mietvertrag-${safeFilePart(body.filenamePart ?? "Mieter")}.pdf`,
  );
}
