"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
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

export function SendDunningDialog({
  dunningId,
  level,
  amountTotal,
  tenantEmail,
}: {
  dunningId: string;
  level: number;
  amountTotal: number;
  tenantEmail: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(tenantEmail ?? "");
  const [sending, setSending] = useState(false);

  // Ohne E-Mail-Adresse: Button deaktiviert mit erklärendem Tooltip.
  if (!tenantEmail) {
    return (
      <span
        title="Keine E-Mail-Adresse beim Mieter hinterlegt"
        className="inline-flex"
      >
        <Button variant="outline" size="sm" disabled>
          <Mail className="size-3.5" />
          Per E-Mail senden
        </Button>
      </span>
    );
  }

  async function onSend() {
    if (!email.trim()) {
      toast.error("Bitte eine E-Mail-Adresse angeben.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/mahnung-senden", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dunningId, email: email.trim() }),
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
      toast.success("Mahnung versendet");
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
        <Button variant="outline" size="sm">
          <Mail className="size-3.5" />
          Per E-Mail senden
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mahnung per E-Mail senden</DialogTitle>
          <DialogDescription>
            Stufe {level} · Gesamtforderung {formatCurrency(amountTotal)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dunning-email">Empfängeradresse</Label>
          <Input
            id="dunning-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@beispiel.de"
          />
        </div>

        {level >= 3 ? (
          <div className="rounded-lg border border-warning-100 bg-warning-50 px-3 py-2 text-sm text-warning-700">
            Empfehlung: Versenden Sie die letzte Mahnung zusätzlich postalisch
            (Einwurf-Einschreiben), um den Zugang nachweisen zu können.
          </div>
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
