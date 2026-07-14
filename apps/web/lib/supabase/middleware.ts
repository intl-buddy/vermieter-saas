import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Aktualisiert bei jedem Request die Supabase-Session (Token-Refresh) und
 * schützt geschützte Bereiche. Nicht eingeloggte Besucher der geschützten
 * Pfade werden auf `/login` umgeleitet.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/objekte", "/mieteingang"];
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // WICHTIG: `getUser()` erneuert bei Bedarf das Access-Token. Zwischen dem
  // Erstellen des Clients und diesem Aufruf darf kein weiterer Code laufen,
  // sonst können schwer auffindbare Logout-Probleme entstehen.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Geschützte Bereiche: ohne Session → /login
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
