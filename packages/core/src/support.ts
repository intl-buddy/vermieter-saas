// ============================================================================
// Hilfe / Support-Tickets – Typen, Labels & reines Parsing (framework-frei).
// Die Admin-Übersicht liefert die SECURITY-DEFINER-Funktion admin_list_tickets()
// als JSON; hier nur Typen und ein robuster Parser dafür.
// ============================================================================

export type TicketCategory = "frage" | "problem" | "idee" | "abrechnung";
export type TicketStatus = "open" | "in_progress" | "closed";
export type TicketSender = "user" | "admin";

/** Anzeigenamen der Kategorien (auch für den Mail-Betreff). */
export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  frage: "Frage",
  problem: "Problem",
  idee: "Idee",
  abrechnung: "Abrechnung",
};

/** Reihenfolge der Kategorien im Auswahlfeld. */
export const TICKET_CATEGORY_ORDER: TicketCategory[] = [
  "frage",
  "problem",
  "abrechnung",
  "idee",
];

/** Anzeigenamen der Status. */
export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  closed: "Beantwortet",
};

export function isTicketCategory(value: string): value is TicketCategory {
  return value === "frage" || value === "problem" || value === "idee" ||
    value === "abrechnung";
}

export function isTicketStatus(value: string): value is TicketStatus {
  return value === "open" || value === "in_progress" || value === "closed";
}

export interface TicketMessageView {
  id: string;
  sender: TicketSender;
  message: string;
  created_at: string;
}

/** Eine Ticket-Zeile in der Admin-Übersicht (inkl. Verlauf und Nutzerdaten). */
export interface AdminTicketView {
  id: string;
  userId: string;
  userEmail: string;
  userPlan: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  adminNote: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessageView[];
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function parseMessages(value: unknown): TicketMessageView[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const o = (raw ?? {}) as Record<string, unknown>;
    return {
      id: str(o.id),
      sender: o.sender === "admin" ? "admin" : "user",
      message: str(o.message),
      created_at: str(o.created_at),
    };
  });
}

/** Parst die JSON-Antwort von admin_list_tickets() in typisierte Zeilen. */
export function parseAdminTickets(value: unknown): AdminTicketView[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const o = (raw ?? {}) as Record<string, unknown>;
    const category = str(o.category);
    const status = str(o.status);
    const note = str(o.admin_note);
    return {
      id: str(o.id),
      userId: str(o.user_id),
      userEmail: str(o.user_email),
      userPlan: str(o.user_plan),
      subject: str(o.subject),
      category: isTicketCategory(category) ? category : "frage",
      status: isTicketStatus(status) ? status : "open",
      adminNote: note ? note : null,
      message: str(o.message),
      createdAt: str(o.created_at),
      updatedAt: str(o.updated_at),
      messages: parseMessages(o.messages),
    };
  });
}
