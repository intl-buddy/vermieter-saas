// Programmatische tefter-Marke als SVG (kein Bildimport): kleines „t" in
// Marineblau mit Gold-Punkt rechts unten, auf weißem, leicht abgerundetem
// Hintergrund. Einzige Quelle für Favicon (app/icon.tsx), Apple-Icon
// (app/apple-icon.tsx) und die statischen PWA-PNGs (scripts/generate-icons.mjs).
//
// Der Buchstabe ist als Vektor gezeichnet (nicht als Text), damit das Icon
// ohne Schrift-Abhängigkeit überall pixelgenau und offline reproduzierbar ist.

const BLUE = "#1E3A8A";
const GOLD = "#C2AA63";

/**
 * @param {{ size?: number, radius?: number, pad?: number, dot?: boolean, bg?: string }} [opts]
 *  - size:   Kantenlänge in px (Standard 512).
 *  - radius: Eckenrundung des Hintergrunds als Anteil der Kantenlänge (0 = eckig).
 *  - pad:    Innenabstand des „t" als Anteil der Kantenlänge (Safe-Zone).
 *  - dot:    Gold-Punkt anzeigen (bei sehr kleinen Größen weglassen).
 *  - bg:     Hintergrundfarbe (Standard weiß; für Apple ohne Transparenz).
 * @returns {string} vollständiges SVG-Dokument
 */
export function iconSvg(opts = {}) {
  const size = opts.size ?? 512;
  const radius = opts.radius ?? 0.22;
  const pad = opts.pad ?? 0.1;
  const dot = opts.dot ?? true;
  const bg = opts.bg ?? "#ffffff";

  const r = +(size * radius).toFixed(2);
  const off = +(size * pad).toFixed(2);
  const scale = +((size * (1 - 2 * pad)) / 100).toFixed(5);

  // „t" im 100×100-Raster: hoher Querbalken (macht es zum t, nicht +),
  // langer Stamm mit kurzem Fuß nach rechts, Gold-Punkt rechts unten.
  const glyph = `
    <g transform="translate(${off} ${off}) scale(${scale})">
      <rect x="42" y="16" width="16" height="66" rx="8" fill="${BLUE}"/>
      <rect x="26" y="30" width="48" height="15" rx="7.5" fill="${BLUE}"/>
      <rect x="50" y="68" width="23" height="14" rx="7" fill="${BLUE}"/>
      ${dot ? `<circle cx="83" cy="75" r="8" fill="${GOLD}"/>` : ""}
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/>${glyph}</svg>`;
}

/** SVG als base64-Data-URI (für <img> in ImageResponse). */
export function iconDataUri(opts = {}) {
  const svg = iconSvg(opts);
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(svg).toString("base64")
      : btoa(svg);
  return `data:image/svg+xml;base64,${b64}`;
}
