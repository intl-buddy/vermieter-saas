// ============================================================================
// Verwaltungsanfragen – reine, testbare Statuslogik.
// ============================================================================

export type ManagementInquiryStatus = "new" | "contacted" | "closed";

/**
 * Nächster Status im Zyklus new → contacted → closed. `closed` ist der
 * Endzustand (null = kein weiterer Schritt).
 */
export function nextInquiryStatus(
  status: ManagementInquiryStatus,
): ManagementInquiryStatus | null {
  if (status === "new") return "contacted";
  if (status === "contacted") return "closed";
  return null;
}

/**
 * Wiederholungsschutz: Ein Nutzer darf nur dann eine neue Anfrage senden, wenn
 * keine offene existiert (also gar keine oder eine bereits abgeschlossene).
 */
export function canSubmitInquiry(
  existing: ManagementInquiryStatus | null,
): boolean {
  return existing === null || existing === "closed";
}
