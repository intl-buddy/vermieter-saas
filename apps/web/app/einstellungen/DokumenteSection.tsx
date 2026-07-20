"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setPdfFooterEnabled } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

/**
 * Abschnitt „Dokumente": schaltet die dezente PDF-Fußzeile für alle erzeugten
 * Dokumente an/aus. Optimistische UI mit Rücksetzung bei Fehler.
 */
export function DokumenteSection({
  footerEnabled,
}: {
  footerEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(footerEnabled);
  const [pending, startTransition] = useTransition();

  function onToggle(next: boolean) {
    setEnabled(next);
    startTransition(async () => {
      const res = await setPdfFooterEnabled(next);
      if (res.error) {
        setEnabled(!next);
        toast.error(res.error);
        return;
      }
      toast.success(
        next ? "Fußzeile wird angezeigt." : "Fußzeile ausgeblendet.",
      );
    });
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="font-medium">
            Fußzeile „Erstellt mit tefter · tefter.de"
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Erscheint dezent auf allen erzeugten PDFs (Nebenkostenabrechnung,
            Mahnung, Vorlagen, Übergabeprotokoll). Du kannst sie hier ausblenden.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={pending}
          aria-label="PDF-Fußzeile anzeigen"
        />
      </CardContent>
    </Card>
  );
}
