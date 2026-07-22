// ============================================================================
// Miet-Laufzeit – reine, testbare Datumslogik (Gewerbemietvertrag).
// ============================================================================

/**
 * Enddatum eines befristeten Mietverhältnisses: Mietbeginn + feste Laufzeit in
 * Jahren, minus ein Tag (der Tag vor dem Jahrestag). Liefert ISO `YYYY-MM-DD`
 * oder "" bei ungültiger Eingabe.
 *
 * Beispiel: 2024-01-01 + 5 Jahre → 2028-12-31.
 */
export function commercialLeaseEndDate(
  startIso: string,
  years: number,
): string {
  if (!startIso || !Number.isFinite(years) || years <= 0) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startIso);
  if (!m) return "";
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const end = new Date(Date.UTC(y + years, mo - 1, d));
  if (Number.isNaN(end.getTime())) return "";
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
}
