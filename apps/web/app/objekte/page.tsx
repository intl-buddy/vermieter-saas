import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PropertyForm } from "./PropertyForm";

export const metadata = { title: "Objekte · tefter" };

export default async function ObjektePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zusätzliche Absicherung zur Middleware.
  if (!user) {
    redirect("/login");
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, street, house_number, zip, city, units(count)")
    .order("name", { ascending: true });

  return (
    <AppShell title="Objekte" userEmail={user.email ?? ""}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Objekte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verwalte deine Liegenschaften und ihre Einheiten.
        </p>
      </div>

      <details className="mb-6 rounded-xl border border-neutral-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-primary marker:hidden hover:text-primary-600">
          + Neues Objekt anlegen
        </summary>
        <div className="border-t border-neutral-100 p-4">
          <PropertyForm mode="create" />
        </div>
      </details>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-danger-700">
            Die Objekte konnten nicht geladen werden: {error.message}
          </CardContent>
        </Card>
      ) : !properties || properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <p className="text-base font-medium">
              Noch keine Objekte – lege dein erstes an
            </p>
            <p className="text-sm text-muted-foreground">
              Nutze „+ Neues Objekt anlegen" oben, um loszulegen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead className="text-right">Einheiten</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => {
                const unitCount = property.units?.[0]?.count ?? 0;
                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/objekte/${property.id}`}
                        className="block max-w-[220px] truncate text-foreground hover:text-primary"
                      >
                        {property.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span
                        className="block max-w-[280px] truncate"
                        title={`${property.street} ${property.house_number}, ${property.zip} ${property.city}`}
                      >
                        {property.street} {property.house_number}, {property.zip}{" "}
                        {property.city}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {unitCount}
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
