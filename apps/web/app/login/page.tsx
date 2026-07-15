"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { login, type AuthState } from "@/app/actions";
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

const initialState: AuthState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Anmelden …" : "Anmelden"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <AuthShell>
      <Card className="border-t-4 border-t-gold-400">
        <CardHeader>
          <CardTitle className="text-2xl">Willkommen zurück</CardTitle>
          <CardDescription>
            Melde dich mit deinem Konto an.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@beispiel.de"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
              <div className="text-right">
                <Link
                  href="/passwort-vergessen"
                  className="text-sm font-medium text-secondary hover:underline"
                >
                  Passwort vergessen?
                </Link>
              </div>
            </div>
            <SubmitButton />
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Noch kein Konto?{" "}
            <Link
              href="/registrieren"
              className="font-medium text-primary hover:underline"
            >
              Jetzt registrieren
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
