import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildUserExportZip } from "@/lib/dataExport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * DSGVO-Datenexport (Art. 20): liefert ein ZIP mit allen Tabellendaten (CSV)
 * und Storage-Dateien des eingeloggten Nutzers. Für alle Nutzer verfügbar
 * (auch im Lesemodus). Auslösung per Direkt-Download-Link.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  try {
    const zip = await buildUserExportZip(supabase, user.id);
    // In einen frisch allokierten Uint8Array<ArrayBuffer> kopieren, damit der
    // Typ als BodyInit akzeptiert wird.
    const body = new Uint8Array(zip.byteLength);
    body.set(zip);
    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="tefter-datenexport-${stamp}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: `Export fehlgeschlagen: ${
          e instanceof Error ? e.message : "unbekannt"
        }`,
      },
      { status: 500 },
    );
  }
}
