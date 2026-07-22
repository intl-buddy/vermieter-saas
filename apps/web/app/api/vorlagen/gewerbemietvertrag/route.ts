import { createClient } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/account-context";
import { renderGewerbemietvertragPdf } from "@/lib/pdf/gewerbemietvertrag";
import type {
  GewerbemietvertragData,
  GewerbeRaum,
  GewerbeStaffel,
} from "@/lib/pdf/gewerbemietvertragContent";
import { pdfDownloadResponse, safeFilePart } from "@/lib/pdf/pdfResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = Partial<
  Omit<GewerbemietvertragData, "raeume" | "staffeln" | "anlagen">
> & {
  raeume?: GewerbeRaum[];
  staffeln?: GewerbeStaffel[];
  anlagen?: GewerbemietvertragData["anlagen"];
  filenamePart?: string;
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

  const data: GewerbemietvertragData = {
    vermieterName,
    vermieterAnschrift,
    mieterFirma: body.mieterFirma ?? "",
    mieterVertreter: body.mieterVertreter ?? "",
    mieterAnschrift: body.mieterAnschrift ?? "",

    objektAdresse: body.objektAdresse ?? "",
    raeume: Array.isArray(body.raeume)
      ? body.raeume
          .filter((r) => r && (r.etage || r.beschreibung))
          .map((r) => ({
            etage: String(r.etage ?? ""),
            beschreibung: String(r.beschreibung ?? ""),
          }))
      : [],
    mietflaeche: num(body.mietflaeche),
    schluessel: body.schluessel ?? "",

    mietzweck: body.mietzweck ?? "",

    renovierungsbeduerftig: Boolean(body.renovierungsbeduerftig),
    rueckgabeRenoviert: Boolean(body.rueckgabeRenoviert),
    inventar: body.inventar ?? "",

    mietbeginn: body.mietbeginn ?? "",
    laufzeitJahre: num(body.laufzeitJahre),
    verlaengerungAnzahl: num(body.verlaengerungAnzahl),
    verlaengerungJahre: num(body.verlaengerungJahre),

    nettoGrundmiete: num(body.nettoGrundmiete),
    bankName: body.bankName ?? "",
    kontoinhaber: body.kontoinhaber || vermieterName,
    iban: body.iban ?? "",
    bic: body.bic ?? "",
    betriebskosten: num(body.betriebskosten),
    sonstigeKostenBez: body.sonstigeKostenBez ?? "",
    sonstigeKostenBetrag: num(body.sonstigeKostenBetrag),
    ustOption: Boolean(body.ustOption),

    anpassung:
      body.anpassung === "staffel" || body.anpassung === "index"
        ? body.anpassung
        : "standard",
    staffeln: Array.isArray(body.staffeln)
      ? body.staffeln
          .filter((s) => s && s.ab)
          .map((s) => ({ ab: s.ab, miete: num(s.miete) }))
      : [],

    kaution: num(body.kaution),

    instandEinzelfall: num(body.instandEinzelfall),
    instandJahr: num(body.instandJahr),

    aussenreklame: body.aussenreklame ?? "",
    ausgenommeneSachen: body.ausgenommeneSachen ?? "",
    wettbewerbsschutz:
      body.wettbewerbsschutz === "gewaehren" ? "gewaehren" : "ausschliessen",

    besondere: body.besondere ?? "",
    gerichtsstand: body.gerichtsstand ?? "",

    anlagen: {
      betrkv: Boolean(body.anlagen?.betrkv),
      sepa: Boolean(body.anlagen?.sepa),
      hausordnung: Boolean(body.anlagen?.hausordnung),
    },
    footerEnabled: profile?.pdf_footer_enabled ?? true,
  };

  const pdf = await renderGewerbemietvertragPdf(data);
  return pdfDownloadResponse(
    pdf,
    `Gewerbemietvertrag-${safeFilePart(body.filenamePart || data.mieterFirma || "Mieter")}.pdf`,
  );
}
