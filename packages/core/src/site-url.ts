// ============================================================================
// Öffentliche Basis-URL der App (framework-frei, testbar).
//
// Jeder Link, der in einer E-Mail landet (Registrierung bestätigen, Passwort
// zurücksetzen, E-Mail-Adresse ändern) oder von einem externen Dienst
// angesprungen wird (Stripe), muss die von außen erreichbare Adresse tragen.
// Der Container bindet auf 0.0.0.0 – diese Adresse gilt nur containerintern
// und ist für Nutzer nicht erreichbar. Sie darf deshalb niemals in einen Link
// geraten, egal aus welcher Quelle sie stammt.
// ============================================================================

/** Hosts, die nur containerintern gelten und nie in einem Link landen dürfen. */
const CONTAINER_ONLY_HOSTS = new Set(["0.0.0.0", "[::]", "::", ""]);

/** Letzter Ausweg – nur lokal sinnvoll. */
export const DEFAULT_SITE_URL = "http://localhost:3000";

/**
 * Prüft einen Kandidaten und gibt ihn als sauberen Origin zurück
 * (`https://app.tefter.de`, ohne Pfad und ohne Schrägstrich am Ende).
 * Liefert `null`, wenn der Wert unbrauchbar ist: leer, kein gültiges
 * http(s)-URL oder eine nur containerintern gültige Adresse.
 */
export function normalizeOrigin(
  value: string | null | undefined,
): string | null {
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (CONTAINER_ONLY_HOSTS.has(url.hostname)) return null;

  return url.origin;
}

/**
 * Wählt aus den Kandidaten den ersten brauchbaren Origin – in der Reihenfolge
 * der Übergabe, also üblicherweise: NEXT_PUBLIC_SITE_URL zuerst, danach ein
 * aus der Anfrage abgeleiteter Fallback (origin-Header bzw.
 * window.location.origin). Greift nichts, bleibt DEFAULT_SITE_URL.
 */
export function resolveSiteUrl(
  ...candidates: (string | null | undefined)[]
): string {
  for (const candidate of candidates) {
    const origin = normalizeOrigin(candidate);
    if (origin) return origin;
  }
  return DEFAULT_SITE_URL;
}
