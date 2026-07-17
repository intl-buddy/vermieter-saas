"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Versendet das abgeschlossene Protokoll per E-Mail an den Mieter (Adresse
 * vorbefüllt/editierbar), optional mit Kopie an den Vermieter. Ruft die Route
 * /api/protokoll-senden auf (Brevo, PDF als Anhang).
 */
export function SendProtocolDialog({
  protocolId,
  tenantEmail,
  landlordEmail,
}: {
  protocolId: string;
  tenantEmail: string | null;
  landlordEmail: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(tenantEmail ?? "");
  const [copy, setCopy] = useState(false);
  const [sending, setSending] = useState(false);

  async function onSend() {
    if (!email.trim()) {
      toast.error("Bitte eine E-Mail-Adresse angeben.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/protokoll-senden", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          protocolId,
          email: email.trim(),
          copyToLandlord: copy,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Der Versand ist fehlgeschlagen.");
        setSending(false);
        return;
      }
      toast.success("Protokoll versendet");
      setOpen(false);
      setSending(false);
      router.refresh();
    } catch {
      toast.error("Der Versand ist fehlgeschlagen.");
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="size-4" />
          Per E-Mail senden
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Protokoll per E-Mail an den Mieter senden?</DialogTitle>
          <DialogDescription>
            Das PDF wird als Anhang versendet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="protocol-email">Empfängeradresse</Label>
          <Input
            id="protocol-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@beispiel.de"
          />
        </div>

        {landlordEmail ? (
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={copy}
              onChange={(e) => setCopy(e.target.checked)}
              className="size-4"
            />
            Kopie an mich ({landlordEmail})
          </label>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={sending}>
              Abbrechen
            </Button>
          </DialogClose>
          <Button onClick={onSend} disabled={sending}>
            {sending ? "Wird gesendet …" : "Jetzt senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
