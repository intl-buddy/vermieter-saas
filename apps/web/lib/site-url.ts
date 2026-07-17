import { resolveSiteUrl } from "@repo/core";

/**
 * Öffentliche Basis-URL der App – die einzige Quelle für Links, die im Browser
 * eines Nutzers landen (Bestätigungs- und Passwort-Mails, Stripe-Rücksprünge).
 *
 * WICHTIG – Build- vs. Laufzeit: `NEXT_PUBLIC_*` wird von Next.js im
 * Client-Bundle zur BUILD-Zeit als Literal eingebacken; serverseitig wird
 * process.env zur LAUFZEIT gelesen. `NEXT_PUBLIC_SITE_URL` muss in Coolify
 * deshalb sowohl als Build- als auch als Runtime-Variable gesetzt sein (und im
 * Dockerfile als ARG durchgereicht werden) – sonst ist der Wert im
 * Client-Bundle `undefined` und es greift nur der Fallback.
 *
 * @param fallbackOrigin Aus der Anfrage abgeleitete Adresse:
 *   serverseitig der `origin`-Header, clientseitig `window.location.origin`.
 *   Containerinterne Adressen (0.0.0.0) werden verworfen.
 */
export function siteUrl(fallbackOrigin?: string | null): string {
  // Literal referenzieren, damit Next.js den Wert im Client-Bundle ersetzen kann.
  return resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, fallbackOrigin);
}

/**
 * Baut aus den Proxy-Headern die von außen sichtbare Adresse. Hinter dem
 * Coolify-Proxy trägt `x-forwarded-host` die echte Domain, während der
 * Next-Standalone-Server intern auf 0.0.0.0:3000 lauscht.
 */
function fromForwardedHeaders(headers: Headers): string | null {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return null;

  // Kann bei mehreren Proxys eine Liste sein („https,http") – der erste gilt.
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const protocol = forwardedProto ?? (isLocal ? "http" : "https");

  return `${protocol}://${host}`;
}

/**
 * Serverseitige Variante für Route Handler und Server Actions.
 *
 * Reihenfolge: NEXT_PUBLIC_SITE_URL → `origin`-Header (bei POST aus dem
 * Browser gesetzt) → Proxy-Header (bei GET-Navigationen, z. B. der Rücksprung
 * aus der Bestätigungsmail). Bewusst NICHT aus `request.url` abgeleitet: Das
 * ergibt im Container die interne Adresse (0.0.0.0:3000).
 */
export function siteUrlFromHeaders(headers: Headers): string {
  return resolveSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL,
    headers.get("origin"),
    fromForwardedHeaders(headers),
  );
}
