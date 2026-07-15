"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth";
import { AuthShell } from "@/components/auth-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "checking" | "ready" | "invalid";

export default function PasswortZuruecksetzenPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Der Recovery-Link stellt eine Session her: Der Browser-Client tauscht den
  // Code/Token aus der URL automatisch ein (detectSessionInUrl) und feuert das
  // PASSWORD_RECOVERY- bzw. SIGNED_IN-Event. Wir warten kurz darauf; bleibt die
  // Session aus (Link fehlt/abgelaufen), zeigen wir eine verständliche Meldung.
  useEffect(() => {
    let settled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        settled = true;
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settled = true;
        setStatus("ready");
      }
    });

    const timeout = setTimeout(() => {
      if (!settled) setStatus("invalid");
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (password !== confirm) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(translateAuthError(error.message));
      setSubmitting(false);
      return;
    }

    toast.success("Passwort geändert");
    router.push("/dashboard");
  }

  return (
    <AuthShell>
      <Card className="border-t-4 border-t-gold-400">
        <CardHeader>
          <CardTitle className="text-2xl">Neues Passwort</CardTitle>
          <CardDescription>
            Vergib ein neues Passwort für dein Konto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "checking" ? (
            <p className="text-sm text-muted-foreground">
              Dein Link wird geprüft …
            </p>
          ) : status === "invalid" ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen
                Link an.
              </div>
              <Button asChild className="w-full">
                <Link href="/passwort-vergessen">Neuen Link anfordern</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Neues Passwort</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm">Passwort wiederholen</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Wird gespeichert …" : "Passwort speichern"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
