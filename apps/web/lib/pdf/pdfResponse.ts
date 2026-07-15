/**
 * Baut aus gerenderten PDF-Bytes eine Download-Response. Kopiert die Bytes in
 * einen frischen `Uint8Array`, da Node einen `Buffer` (ArrayBufferLike) liefert,
 * `Response` aber einen `ArrayBuffer` erwartet.
 */
export function pdfDownloadResponse(
  pdf: Uint8Array,
  filename: string,
): Response {
  const body = new Uint8Array(pdf.byteLength);
  body.set(pdf);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Ersetzt alle für Dateinamen ungeeigneten Zeichen durch Unterstriche. */
export function safeFilePart(value: string): string {
  return value.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "") || "Dokument";
}
