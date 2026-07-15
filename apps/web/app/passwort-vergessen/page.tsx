"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { requestPasswordReset, type AuthState } from "@/app/actions";
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
      {pending ? "Wird gesendet …" : "Link anfordern"}
    </Button>
  );
}

export default function PasswortVergessenPage() {
  const [state, formAction] = useActionState(
    requestPasswordReset,
    initialState,
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.message) toast.success(state.message);
  }, [state]);

  return (
    <AuthShell>
      <Card className="border-t-4 border-t-gold-400">
        <CardHeader>
          <CardTitle className="text-2xl">Passwort vergessen?</CardTitle>
          <CardDescription>
            Gib deine E-Mail-Adresse ein und wir schicken dir einen Link zum
            Zurücksetzen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.message ? (
            <div className="rounded-xl border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-700">
              {state.message}
            </div>
          ) : (
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
              <SubmitButton />
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-secondary hover:underline"
            >
              Zurück zur Anmeldung
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
