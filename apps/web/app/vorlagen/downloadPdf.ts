/**
 * Sendet die Vorlagendaten an eine API-Route, empfängt das gerenderte PDF als
 * Blob und stößt im Browser den Download an. Kein Storage nötig.
 */
export async function downloadPdf(
  endpoint: string,
  payload: unknown,
): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || "Das PDF konnte nicht erzeugt werden.");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const filename = match?.[1] ?? "dokument.pdf";

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Heutiges Datum als `YYYY-MM-DD` in lokaler Zeit. */
export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/** Datum in `days` Tagen als `YYYY-MM-DD` in lokaler Zeit. */
export function isoInDays(days: number): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const base = new Date(now.getTime() - offset * 60_000);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}
