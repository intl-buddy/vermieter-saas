import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { ensureUserRecord } from "../../../lib/auth";
import { siteUrlFromHeaders } from "../../../lib/site-url";

/**
 * Tauscht den bei der E-Mail-Bestätigung / OAuth erhaltenen Code gegen eine
 * Session ein und legt anschließend den public.users-Eintrag an.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = nextParam ?? "/dashboard";

  // Ziel-Origin aus SITE_URL bzw. den Proxy-Headern, NICHT aus request.url:
  // Letzteres ist im Container die interne Adresse (0.0.0.0:3000) und landete
  // so in der Weiterleitung nach der Bestätigung.
  const base = siteUrlFromHeaders(request.headers);

  // `next` kommt aus der Query und darf die Weiterleitung nicht auf eine
  // fremde Domain umbiegen – nur interne, absolute Pfade zulassen.
  const target =
    next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let dest = target;
      if (user) {
        await ensureUserRecord(supabase, user);
        // Ohne explizites `next` neue Nutzer ins Onboarding führen.
        if (!nextParam) {
          const { data: profile } = await supabase
            .from("users")
            .select("onboarding_completed")
            .eq("id", user.id)
            .maybeSingle();
          if (!profile?.onboarding_completed) dest = "/willkommen";
        }
      }
      return NextResponse.redirect(`${base}${dest}`);
    }
  }

  // Kein Code oder Fehler beim Austausch → zurück zum Login.
  return NextResponse.redirect(`${base}/login?fehler=bestaetigung`);
}
