import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, FileText, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Vorlagen · tefter" };

const TEMPLATES = [
  {
    href: "/vorlagen/abmahnung",
    title: "Abmahnung",
    description:
      "Förmliche Abmahnung bei Pflichtverletzungen – unpünktliche Zahlung, Gemeinschaftsflächen, Rauchen oder Lärm.",
    icon: AlertTriangle,
  },
  {
    href: "/vorlagen/wohnungsgeberbescheinigung",
    title: "Wohnungsgeberbescheinigung",
    description:
      "Wohnungsgeberbestätigung gemäß § 19 Bundesmeldegesetz (BMG) zur Vorlage bei der Meldebehörde.",
    icon: FileText,
  },
  {
    href: "/vorlagen/mietvertrag",
    title: "Mietvertrag",
    description:
      "Vollständiger Wohnraummietvertrag als Mustervorlage mit vorbefüllten Vertragsdaten.",
    icon: Home,
  },
];

export default async function VorlagenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell title="Vorlagen" userEmail={user.email ?? ""}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Vorlagen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Erzeuge fertige PDF-Dokumente – Objekt, Einheit und Mieter auswählen,
          Angaben ergänzen, herunterladen.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <Link key={tpl.href} href={tpl.href} className="group">
              <Card className="flex h-full flex-col gap-3 p-5 transition-colors group-hover:border-primary group-hover:shadow-md">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary-100 text-secondary-700">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {tpl.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tpl.description}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
