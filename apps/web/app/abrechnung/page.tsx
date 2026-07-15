import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Abrechnungen · tefter" };

export default async function AbrechnungenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: runs } = await supabase
    .from("billing_runs")
    .select(
      "id, period_start, period_end, status, total_costs, tenant_count, properties(name)",
    )
    .order("created_at", { ascending: false });

  return (
    <AppShell title="Abrechnungen" userEmail={user.email ?? ""}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Nebenkostenabrechnungen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deine abgeschlossenen Abrechnungsläufe.
          </p>
        </div>
        <Button asChild>
          <Link href="/abrechnung/neu">
            <Plus className="size-4" />
            Neue Abrechnung
          </Link>
        </Button>
      </div>

      {!runs || runs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-base font-medium">Noch keine Abrechnungen</p>
            <p className="text-sm text-muted-foreground">
              Erstelle deine erste Nebenkostenabrechnung.
            </p>
            <Button asChild>
              <Link href="/abrechnung/neu">Nebenkostenabrechnung erstellen</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objekt</TableHead>
                <TableHead>Zeitraum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Mieter</TableHead>
                <TableHead className="text-right">Summe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => {
                const prop = r.properties as { name: string } | null;
                return (
                  <TableRow key={r.id} className="group relative">
                    <TableCell className="font-medium">
                      <Link
                        href={`/abrechnung/${r.id}`}
                        className="text-foreground hover:text-primary"
                      >
                        {prop?.name ?? "–"}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(r.period_start)} – {formatDate(r.period_end)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Finalisiert</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.tenant_count}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(r.total_costs)}
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
