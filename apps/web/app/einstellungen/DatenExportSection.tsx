"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * DSGVO-Datenexport (Art. 20): lädt das ZIP über /api/datenexport und stößt
 * den Browser-Download an. Zeigt währenddessen einen Ladezustand.
 */
export function DatenExportSection() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/datenexport");
      if (!res.ok) {
        let msg = "Export fehlgeschlagen.";
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {
          // ignore
        }
        toast.error(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `tefter-datenexport-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export erstellt – der Download startet.");
    } catch {
      toast.error("Export fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-sm text-muted-foreground">
        Lade alle deine in tefter gespeicherten Daten als ZIP-Archiv herunter:
        alle Tabellen als CSV (Objekte, Einheiten, Mieter, Zahlungen,
        Soll-Stellungen, Belege, Aufgaben, Abrechnungen, Mahnungen) sowie alle
        hochgeladenen Dateien und PDFs.
      </p>
      <div className="mt-4">
        <Button onClick={handleExport} disabled={loading} variant="outline">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Export wird erstellt …
            </>
          ) : (
            <>
              <Download className="size-4" />
              Alle Daten exportieren (ZIP)
            </>
          )}
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Bereitgestellt gemäß Art. 20 DSGVO (Recht auf Datenübertragbarkeit).
      </p>
    </div>
  );
}
