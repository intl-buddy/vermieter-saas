import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

// Öffentliche Marketing-Hosts. Die App läuft unter app.tefter.de (und lokal),
// dort greift wie bisher das Session-Handling.
const MARKETING_HOSTS = new Set(["tefter.de", "www.tefter.de"]);

/** Host ohne Port, aus x-forwarded-host (Proxy) bzw. Host-Header. */
function hostOf(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  return (raw.split(":")[0] ?? "").toLowerCase();
}

export async function proxy(request: NextRequest) {
  if (MARKETING_HOSTS.has(hostOf(request))) {
    // Marketing-Host: Startseite auf die Landingpage umschreiben, sonstige
    // Pfade (Rechtsseiten etc.) unverändert lassen. Kein Login/Session-Handling.
    if (request.nextUrl.pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/marketing";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // App-Host: unverändertes Session-/Zugriffs-Handling.
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Alle Pfade außer:
     * - _next/static (statische Dateien)
     * - _next/image (Bildoptimierung)
     * - favicon.ico
     * - Bilddateien
     * So läuft die Session-Aktualisierung auf allen relevanten Seiten.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
