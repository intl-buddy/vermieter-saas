import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
              {balances.map((row) => {
                const isArrears = row.balance > 0;
                return (
                  <TableRow key={row.tenant_id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/mieteingang/${row.tenant_id}`}
                        className="text-foreground hover:text-primary"
                      >
                        {tenantName(row.first_name, row.last_name)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(row.total_due)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(row.total_paid)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {isArrears ? (
                        <Badge variant="danger">
                          {formatCurrency(row.balance)}
                        </Badge>
                      ) : row.balance === 0 ? (
                        <Badge variant="gold">Alles bezahlt</Badge>
                      ) : (
                        <span className="text-success-700">
                          {formatCurrency(row.balance)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </AppShell>
  );
}
