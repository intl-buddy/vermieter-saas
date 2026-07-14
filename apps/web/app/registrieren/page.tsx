"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { register, type AuthState } from "@/app/actions";
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
      {pending ? "Konto wird erstellt …" : "Konto erstellen"}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(register, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.message) toast.success(state.message);
  }, [state]);

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Konto erstellen</CardTitle>
          <CardDescription>
            Erstelle dein Konto und verwalte deine Immobilien.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name">Vollständiger Name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                placeholder="Max Mustermann"
              />
            </div>
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
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
            <SubmitButton />
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Bereits ein Konto?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Jetzt anmelden
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
