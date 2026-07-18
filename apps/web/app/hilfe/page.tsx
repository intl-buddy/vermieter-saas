import { redirect } from "next/navigation";
import type { TicketCategory, TicketStatus } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Separator } from "@/components/ui/separator";
import { FooterLinks } from "@/components/footer-links";
import { FaqSection } from "./FaqSection";
import { TicketSection, type UserTicket } from "./TicketSection";

export const metadata = { title: "Hilfe · tefter" };
export const dynamic = "force-dynamic";

export default async function HilfePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Eigene Tickets (RLS beschränkt auf den eingeloggten Nutzer).
  const { data: ticketRows } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ids = (ticketRows ?? []).map((t) => t.id);
  const messagesByTicket = new Map<string, UserTicket["messages"]>();
  if (ids.length > 0) {
    const { data: messageRows } = await supabase
      .from("ticket_messages")
      .select("id, ticket_id, sender, message, created_at")
      .in("ticket_id", ids)
      .order("created_at", { ascending: true });
    for (const m of messageRows ?? []) {
      const list = messagesByTicket.get(m.ticket_id) ?? [];
      list.push({
        id: m.id,
        sender: m.sender,
        message: m.message,
        created_at: m.created_at,
      });
      messagesByTicket.set(m.ticket_id, list);
    }
  }

  const tickets: UserTicket[] = (ticketRows ?? []).map((t) => ({
    id: t.id,
    subject: t.subject,
    category: t.category as TicketCategory,
    status: t.status as TicketStatus,
    message: t.message,
    created_at: t.created_at,
    messages: messagesByTicket.get(t.id) ?? [],
  }));

  return (
    <AppShell title="Hilfe" userEmail={user.email ?? ""}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hilfe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Antworten auf die häufigsten Fragen – und ein direkter Draht zu uns.
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-bold tracking-tight">Häufige Fragen</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Durchsuche die wichtigsten Fragen aus der täglichen Praxis.
        </p>
        <FaqSection />
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Kontakt zum Support</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Stelle eine Anfrage und verfolge den Verlauf deiner Tickets.
        </p>
        <TicketSection tickets={tickets} />
      </div>

      <Separator className="mt-12" />
      <div className="py-6">
        <FooterLinks className="justify-start" />
      </div>
    </AppShell>
  );
}
