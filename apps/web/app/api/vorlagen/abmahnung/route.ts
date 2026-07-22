import { createClient } from "@/lib/supabase/server";
import { getEffectiveUserId } from "@/lib/account-context";
import { renderAbmahnungPdf } from "@/lib/pdf/abmahnungLetter";
import { pdfDownloadResponse, safeFilePart } from "@/lib/pdf/pdfResponse";
import type { LetterSender } from "@/lib/pdf/letterShared";

// @react-pdf/renderer benötigt die Node-Runtime; die Route ist request-abhängig.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  recipient?: { name?: string; lastName?: string; street?: string; zipCity?: string };
  issuedAt?: string;
  deadline?: string;
  grund?: string;
  objektLabel?: string;
  einheitLabel?: string;
  sachverhalt?: string;
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

  if (!body.issuedAt || !body.deadline || !body.recipient?.lastName) {
    return new Response("Pflichtangaben fehlen.", { status: 400 });
  }

  // Absender authentisch aus dem eigenen Profil laden (RLS + explizite id).
  const { data: profile } = await supabase
    .from("users")
    .select(
      "full_name, company_name, address_street, address_zip, address_city, pdf_footer_enabled",
    )
    .eq("id", uid)
    .maybeSingle();

  const sender: LetterSender = {
    fullName: profile?.full_name ?? "",
    companyName: profile?.company_name ?? null,
    addressStreet: profile?.address_street ?? null,
    addressZip: profile?.address_zip ?? null,
    addressCity: profile?.address_city ?? null,
  };

  const pdf = await renderAbmahnungPdf({
    sender,
    recipient: {
      name: body.recipient.name ?? "",
      lastName: body.recipient.lastName,
      street: body.recipient.street ?? "",
      zipCity: body.recipient.zipCity ?? "",
    },
    issuedAt: body.issuedAt,
    deadline: body.deadline,
    grund: body.grund ?? "",
    objektLabel: body.objektLabel ?? "",
    einheitLabel: body.einheitLabel ?? "",
    sachverhalt: body.sachverhalt ?? "",
    footerEnabled: profile?.pdf_footer_enabled ?? true,
  });

  return pdfDownloadResponse(
    pdf,
    `Abmahnung-${safeFilePart(body.recipient.lastName)}.pdf`,
  );
}
