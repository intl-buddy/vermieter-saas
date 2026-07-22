import { createClient } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/account-context";
import { renderMietvertragPdf } from "@/lib/pdf/mietvertrag";
import type { MietvertragData, Staffel } from "@/lib/pdf/mietvertragContent";
import { pdfDownloadResponse, safeFilePart } from "@/lib/pdf/pdfResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = Partial<Omit<MietvertragData, "staffeln" | "anlagen">> & {
  staffeln?: Staffel[];
  anlagen?: MietvertragData["anlagen"];
  filenamePart?: string;
  useOwnVermieter?: boolean;
};

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Nicht angemeldet.", { status: 401 });
  }

  const { effectiveUserId: uid } = await getEffectiveUserId(supabase, user.id);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return new Response("Ungültige Anfrage.", { status: 400 });
  }

  // Vermieter authentisch aus dem eigenen Profil.
  const { data: profile } = await supabase
    .from("users")
    .select(
      "full_name, address_street, address_zip, address_city, pdf_footer_enabled",
    )
    .eq("id", uid)
    .maybeSingle();

  const vermieterName = profile?.full_name ?? "";
  const vermieterAnschrift = [
    profile?.address_street,
    [profile?.address_zip, profile?.address_city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  const data: MietvertragData = {
    vermieterName,
    vermieterAnschrift,
    mieterName: body.mieterName ?? "",
    mieterAnschrift: body.mieterAnschrift ?? "",
    mieterGeburtsdatum: body.mieterGeburtsdatum ?? "",
    objektAdresseLage: body.objektAdresseLage ?? "",
    zimmer: String(body.zimmer ?? ""),
    kuechen: num(body.kuechen),
    baeder: num(body.baeder),
    keller: Boolean(body.keller),
    balkon: Boolean(body.balkon),
    stellplatz: Boolean(body.stellplatz),
    stellplatzBez: body.stellplatzBez ?? "",
    stellplatzMiete: num(body.stellplatzMiete),
    mietbeginn: body.mietbeginn ?? "",
    grundmiete: num(body.grundmiete),
    betriebskosten: num(body.betriebskosten),
    heizkosten: num(body.heizkosten),
    advanceMode: body.advanceMode === "combined" ? "combined" : "split",
    mietart:
      body.mietart === "staffel" || body.mietart === "index"
        ? body.mietart
        : "standard",
    staffeln: Array.isArray(body.staffeln)
      ? body.staffeln
          .filter((s) => s && s.ab)
          .map((s) => ({ ab: s.ab, miete: num(s.miete) }))
      : [],
    kontoinhaber: body.kontoinhaber || vermieterName,
    iban: body.iban ?? "",
    bic: body.bic ?? "",
    depositType: body.depositType ?? "cash_deposit",
    depositAmount: num(body.depositAmount),
    besondere: body.besondere ?? "",
    anlagen: {
      betrkv: Boolean(body.anlagen?.betrkv),
      sepa: Boolean(body.anlagen?.sepa),
      hausordnung: Boolean(body.anlagen?.hausordnung),
      lueftung: Boolean(body.anlagen?.lueftung),
    },
    footerEnabled: profile?.pdf_footer_enabled ?? true,
  };

  const pdf = await renderMietvertragPdf(data);
  return pdfDownloadResponse(
    pdf,
    `Mietvertrag-${safeFilePart(body.filenamePart || data.mieterName || "Mieter")}.pdf`,
  );
}
