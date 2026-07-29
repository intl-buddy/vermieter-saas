"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  requestAccountDeletion,
  type DeletionState,
} from "./gefahrenzone-actions";

/**
 * „Gefahrenzone": unwiderrufliche Selbstlöschung des Kontos. Dezent rot
 * abgesetzt, ganz unten in den Einstellungen. Der Dialog verlangt Passwort +
 * Bestätigung und verlinkt den Datenexport VOR der Löschung.
 */
export function GefahrenzoneSection({
  hasActiveSubscription,
}: {
  hasActiveSubscription: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [state, formAction, pending] = useActionState<DeletionState, FormData>(
    requestAccountDeletion,
    {},
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  // Beim Öffnen/Schließen die Checkbox zurücksetzen.
  useEffect(() => {
    if (!open) setConfirmed(false);
  }, [open]);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/datenexport");
      if (!res.ok) {
        toast.error("Export fehlgeschlagen.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tefter-datenexport-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export erstellt – der Download startet.");
    } catch {
      toast.error("Export fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-xl border border-danger-200 bg-danger-50/40 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-danger-100 text-danger-700">
          <AlertTriangle className="size-4" />
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-danger-700">Konto löschen</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Dein Konto und sämtliche Daten (Objekte, Mieter, Zahlungen,
            Dokumente, PDFs) werden unwiderruflich gelöscht. Du hast nach der
            Bestätigung 7 Tage Zeit, es dir anders zu überlegen – ein Login in
            diesem Zeitraum bricht die Löschung ab.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              className="border-danger-200 text-danger-700 hover:bg-danger-50"
              onClick={() => setOpen(true)}
            >
              Konto löschen
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konto endgültig löschen</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nur innerhalb von 7 Tagen durch einen erneuten
              Login rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>

          {/* Datenexport VOR der Löschung prominent anbieten. */}
          <div className="rounded-lg border border-secondary-200 bg-secondary-50 p-3">
            <p className="text-sm font-medium text-secondary-800">
              Tipp: Sichere zuerst deine Daten.
            </p>
            <p className="mt-0.5 text-xs text-secondary-800/80">
              Nach der Löschung ist kein Zugriff und kein Export mehr möglich.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={exporting}
              onClick={handleExport}
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Alle Daten exportieren (ZIP)
            </Button>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deletion-password">
                Passwort zur Bestätigung
              </Label>
              <Input
                id="deletion-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Dein Passwort"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                name="confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 size-4 rounded border-neutral-300 text-danger-600 focus:ring-danger-600"
              />
              <span>
                Ich verstehe, dass alle Daten unwiderruflich gelöscht werden.
              </span>
            </label>

            {hasActiveSubscription ? (
              <p className="rounded-lg bg-gold-50 px-3 py-2 text-xs text-gold-800">
                Dein Abo wird zum Löschzeitpunkt bei Stripe gekündigt.
              </p>
            ) : null}

            <Button
              type="submit"
              variant="destructive"
              disabled={!confirmed || pending}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Konto endgültig löschen
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
