import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { parseAdminTickets } from "@repo/core";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { AdminTicketsClient } from "./AdminTicketsClient";

export const metadata = { title: "Support-Tickets · Admin · tefter" };
export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guard: kein Nutzer oder kein Admin → 404 (Existenz nicht verraten).
  if (!user) notFound();
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile?.is_admin) notFound();

  const { data: ticketData } = await supabase.rpc("admin_list_tickets");
  const tickets = parseAdminTickets(ticketData);

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "in_progress",
  ).length;

  return (
    <AppShell title="Support-Tickets" userEmail={user.email ?? ""}>
      <div className="mb-6">
        <Link
          href="/novipazar"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-neutral-700"
        >
          <ArrowLeft className="size-4" />
          Admin-Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Support-Tickets
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tickets.length} Tickets insgesamt · {openCount} offen ·{" "}
          {inProgressCount} in Bearbeitung.
        </p>
      </div>

      <AdminTicketsClient tickets={tickets} />
    </AppShell>
  );
}
