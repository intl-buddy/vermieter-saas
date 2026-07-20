import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RentRow } from "./RentRow";

export const metadata = { title: "Mieteingang · tefter" };

/** Baut den Anzeigenamen eines Mieters aus Vor- und Nachname. */
function tenantName(
  firstName: string | null,
  lastName: string | null,
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || "Unbenannter Mieter";
}

export default async function MieteingangPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zusätzliche Absicherung zur Middleware.
  if (!user) {
    redirect("/login");
  }

  const { data: balances, error } = await supabase
    .from("tenant_balances")
    .select("tenant_id, first_name, last_name, total_due, total_paid, balance")
    .order("balance", { ascending: false });

  return (
    <AppShell title="Mieteingang" userEmail={user.email ?? ""}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Mieteingangskontrolle
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Übersicht aller Mietverhältnisse mit Soll, Ist und Saldo. Ein positiver
          Saldo bedeutet einen offenen Rückstand.
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-danger-700">
            Die Mietverhältnisse konnten nicht geladen werden: {error.message}
          </CardContent>
        </Card>
      ) : !balances || balances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <p className="text-base font-medium">
              Noch keine Mietverhältnisse
            </p>
            <p className="text-sm text-muted-foreground">
              Lege zuerst unter „Objekte" ein Mietverhältnis an.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mieter</TableHead>
                <TableHead className="text-right">Soll gesamt</TableHead>
                <TableHead className="text-right">Ist gesamt</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.map((row) => (
                <RentRow
                  key={row.tenant_id ?? ""}
                  row={{
                    tenant_id: row.tenant_id ?? "",
                    name: tenantName(row.first_name, row.last_name),
                    total_due: row.total_due,
                    total_paid: row.total_paid,
                    balance: row.balance,
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </AppShell>
  );
}
