"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function KontoSection({ userEmail }: { userEmail: string }) {
  const [supabase] = useState(() => createClient());

  // E-Mail ändern (Feld mit aktueller Adresse vorbefüllt)
  const [newEmail, setNewEmail] = useState(userEmail);
  const [emailPending, setEmailPending] = useState(false);

  // Passwort ändern
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwPending, setPwPending] = useState(false);

  async function onEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = newEmail.trim();
    if (!email) {
      toast.error("Bitte gib eine neue E-Mail-Adresse ein.");
      return;
    }
    if (email === userEmail) {
      toast.error("Das ist bereits deine aktuelle E-Mail-Adresse.");
      return;
    }

    setEmailPending(true);
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      toast.error(translateAuthError(error.message));
      setEmailPending(false);
      return;
    }
    toast.success(
      "Wir haben dir eine Bestätigungsmail an die neue Adresse geschickt. Die Änderung wird erst nach Bestätigung wirksam.",
    );
    setEmailPending(false);
  }

  async function onPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Die Passwörter stimmen nicht überein.");
      return;
    }

    setPwPending(true);
    // Aktuelles Passwort verifizieren
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });
    if (signInError) {
      toast.error("Das aktuelle Passwort ist nicht korrekt.");
      setPwPending(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(translateAuthError(error.message));
      setPwPending(false);
      return;
    }
    toast.success("Passwort geändert.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwPending(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">E-Mail-Adresse</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onEmailSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new_email">E-Mail-Adresse</Label>
              <Input
                id="new_email"
                type="email"
                autoComplete="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@beispiel.de"
              />
              <p className="text-xs text-muted-foreground">
                Nach dem Speichern erhältst du eine Bestätigungsmail an die neue
                Adresse. Die Änderung wird erst nach Bestätigung aktiv.
              </p>
            </div>
            <div>
              <Button type="submit" disabled={emailPending}>
                {emailPending ? "Wird gesendet …" : "E-Mail ändern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Passwort</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPasswordSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current_password">Aktuelles Passwort</Label>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new_password">Neues Passwort</Label>
                <Input
                  id="new_password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm_password">Passwort wiederholen</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Button type="submit" disabled={pwPending}>
                {pwPending ? "Wird gespeichert …" : "Passwort ändern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
