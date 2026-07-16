import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAccessStatus } from "@repo/core";

/**
 * Aktualisiert bei jedem Request die Supabase-Session (Token-Refresh) und
 * schützt geschützte Bereiche. Nicht eingeloggte Besucher der geschützten
 * Pfade werden auf `/login` umgeleitet.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/objekte",
  "/mieteingang",
  "/aufgaben",
  "/belege",
  "/abrechnung",
  "/einstellungen",
  "/mahnungen",
];

// Geschützte Pfade, auf denen das Abo-Gating NICHT greift: In den
// Einstellungen soll ein gesperrter Nutzer weiterhin sein Abo verwalten
// können.
const GATING_EXEMPT_PREFIXES = ["/einstellungen"];
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

  // Abo-Gating: Nutzer ohne aktiven Zugriff (Trial abgelaufen, gekündigt,
  // Zahlung länger überfällig) werden auf /preise umgeleitet – außer auf den
  // ausgenommenen Pfaden (Abo-Verwaltung in den Einstellungen).
  if (user && isProtected) {
    const isExempt = GATING_EXEMPT_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (!isExempt) {
      const { data: profile } = await supabase
        .from("users")
        .select("subscription_status, trial_ends_at, current_period_end, access_until")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && getAccessStatus(profile) === "locked") {
        const url = request.nextUrl.clone();
        url.pathname = "/preise";
        url.search = "gesperrt=1";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
