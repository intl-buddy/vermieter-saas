import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { ensureUserRecord } from "../../../lib/auth";

/**
 * Tauscht den bei der E-Mail-Bestätigung / OAuth erhaltenen Code gegen eine
 * Session ein und legt anschließend den public.users-Eintrag an.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await ensureUserRecord(supabase, user);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Kein Code oder Fehler beim Austausch → zurück zum Login.
  return NextResponse.redirect(`${origin}/login?fehler=bestaetigung`);
}
