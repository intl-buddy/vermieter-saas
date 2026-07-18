#!/usr/bin/env node
// Erzeugt die statischen PWA-Icons in apps/web/public/ aus der programmatischen
// tefter-Marke (siehe apps/web/lib/icon-art.js). Einmalig ausführen, wenn sich
// das Motiv ändert:  node scripts/generate-icons.mjs
//
// - icon-192.png / icon-512.png   → purpose "any" (weißer, abgerundeter Grund)
// - icon-maskable-512.png         → purpose "maskable" (voller Grund + Safe-Zone)

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { iconSvg } from "../apps/web/lib/icon-art.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, "..", "apps", "web", "public");

/** @type {{ file: string, svg: string }[]} */
const targets = [
  {
    file: "icon-192.png",
    svg: iconSvg({ size: 192, radius: 0.22, pad: 0.14, dot: true }),
  },
  {
    file: "icon-512.png",
    svg: iconSvg({ size: 512, radius: 0.22, pad: 0.14, dot: true }),
  },
  {
    // Maskable: voller Hintergrund bis zum Rand, Motiv in der Safe-Zone (~60 %),
    // damit die Android-Maske nichts Wichtiges abschneidet.
    file: "icon-maskable-512.png",
    svg: iconSvg({ size: 512, radius: 0, pad: 0.24, dot: true }),
  },
];

for (const { file, svg } of targets) {
  const out = join(PUBLIC, file);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("✓", file);
}
