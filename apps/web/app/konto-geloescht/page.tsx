import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Konto wird gelöscht · tefter" };

/**
 * Abschiedsseite nach der vorgemerkten Selbstlöschung. Öffentlich erreichbar –
 * der Nutzer ist nach der Bestätigung ausgeloggt.
 */
export default function KontoGeloeschtPage() {
  return (
    <AuthShell>
      <Card className="border-t-4 border-t-gold-400">
        <CardHeader>
          <CardTitle className="text-2xl">
            Dein Konto wird in 7 Tagen gelöscht
          </CardTitle>
          <CardDescription>
            Melde dich einfach wieder an, um die Löschung abzubrechen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-600">
            Wir haben deine Konto-Löschung vorgemerkt. In den nächsten 7 Tagen
            kannst du sie jederzeit rückgängig machen – ein erneuter Login
            genügt, deine Daten bleiben dann vollständig erhalten. Nach Ablauf
            der Frist werden dein Konto und sämtliche Daten unwiderruflich
            gelöscht.
          </p>
          <p className="mt-4 rounded-lg bg-secondary-50 px-3 py-2 text-sm text-secondary-800">
            Tipp: Falls du es noch nicht getan hast, exportiere nach einem
            erneuten Login deine Daten unter „Einstellungen → Deine Daten".
          </p>
          <div className="mt-6">
            <Button asChild className="w-full">
              <Link href="/login">Wieder anmelden &amp; Löschung abbrechen</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
